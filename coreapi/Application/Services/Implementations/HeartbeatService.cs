using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using coreapi.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Text.RegularExpressions;
using Microsoft.Extensions.DependencyInjection;


namespace CoreApi.Application.Services.Implementations;

/// <summary>
/// Production-grade heartbeat service.
/// 
/// Responsibilities:
///   1. Persisting / updating heartbeat configuration on an Agent document.
///   2. Executing a single LLM pulse (called by the BackgroundService).
///   3. CRUD for HeartbeatLog collection.
/// 
/// Thread-safety: all public methods are stateless — they create their own
/// scoped DB operations, so the singleton registration is safe.
/// </summary>
public sealed class HeartbeatService : IHeartbeatService
{
    private readonly IRepository<Agent>        _agentRepo;
    private readonly IRepository<HeartbeatLog> _logRepo;
    private readonly ILogService               _activityLog;
    private readonly IKernelProviderService    _kernelProvider;
    private readonly IServiceProvider          _serviceProvider;
    private readonly IMemoryBookService        _memoryBook;

    public HeartbeatService(
        IRepository<Agent>        agentRepo,
        IRepository<HeartbeatLog> logRepo,
        ILogService               activityLog,
        IKernelProviderService    kernelProvider,
        IServiceProvider          serviceProvider,
        IMemoryBookService        memoryBook)
    {
        _agentRepo       = agentRepo;
        _logRepo         = logRepo;
        _activityLog     = activityLog;
        _kernelProvider  = kernelProvider;
        _serviceProvider = serviceProvider;
        _memoryBook      = memoryBook;
    }

    // ── Configuration ──────────────────────────────────────────────────────────

    public async Task<Agent?> ConfigureAsync(
        string agentId,
        bool   enabled,
        int    intervalMinutes,
        string instruction,
        CancellationToken ct = default)
    {
        var agent = await _agentRepo.GetByIdAsync(agentId);
        if (agent is null) return null;

        // Clamp interval to sane bounds: 1 minute → 1440 minutes (24 h)
        intervalMinutes = Math.Clamp(intervalMinutes, 1, 1440);

        agent.HeartbeatEnabled         = enabled;
        agent.HeartbeatIntervalMinutes = intervalMinutes;
        agent.HeartbeatInstruction     = instruction.Trim();

        // If enabling, set the very first fire-time immediately so the worker
        // picks it up on its next scan without waiting a full interval.
        if (enabled)
        {
            agent.NextHeartbeatAt = DateTime.UtcNow
                .AddMinutes(intervalMinutes)
                .ToString("o");
        }
        else
        {
            // Clear schedule when disabled
            agent.NextHeartbeatAt = null;
        }

        await _agentRepo.SaveAsync(agent);

        var stateLabel = enabled
            ? $"enabled (every {intervalMinutes} min)"
            : "disabled";
        await _activityLog.AddLogAsync(
            $"Heartbeat {stateLabel} for agent \"{agent.Name}\" ({agent.Role}).",
            "system",
            agentName: agent.Name);

        return agent;
    }

    // ── Execution ──────────────────────────────────────────────────────────────

    public async Task<HeartbeatLog> ExecutePulseAsync(Agent agent, CancellationToken ct = default)
    {
        var logId    = $"hb-{agent.Id}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var logEntry = new HeartbeatLog
        {
            Id          = logId,
            AgentId     = agent.Id,
            AgentName   = agent.Name,
            Timestamp   = DateTime.UtcNow.ToString("o"),
            Instruction = agent.HeartbeatInstruction,
            Success     = false
        };

        try
        {
            // Mark agent as "thinking" during heartbeat
            agent.Status = "thinking";
            await _agentRepo.SaveAsync(agent);

            var kernel = _kernelProvider.CreateKernel(agent.ModelId, agent.SubsidiaryId);

            // ── Inject Memory Book context ──
            var memoryContext = await _memoryBook.GetContextSnapshotAsync(agent, ct);
            var systemPrompt  = BuildSystemPrompt(agent, memoryContext);
            var userPrompt    = string.IsNullOrWhiteSpace(agent.HeartbeatInstruction)
                ? "Perform your autonomous heartbeat self-check. Summarise your current operational status and any proactive observations. If you learn something important, persist it using <MEMORY> tags."
                : agent.HeartbeatInstruction;

            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(systemPrompt);
            chatHistory.AddUserMessage(userPrompt);

            var chatService = kernel.GetRequiredService<IChatCompletionService>();
            var result      = await chatService.GetChatMessageContentAsync(chatHistory, cancellationToken: ct);
            var response    = result.Content ?? string.Empty;

            logEntry.Response = response;
            logEntry.Success  = true;

            // ── Update agent state ──
            agent.LastHeartbeatAt = DateTime.UtcNow.ToString("o");
            agent.NextHeartbeatAt = DateTime.UtcNow
                .AddMinutes(agent.HeartbeatIntervalMinutes)
                .ToString("o");
            agent.Status = "idle";
            await _agentRepo.SaveAsync(agent);

            // ── Activity feed ──
            var summary = response.Length > 120
                ? response[..120].TrimEnd() + "…"
                : response;
            await _activityLog.AddLogAsync(
                $"[Heartbeat] {agent.Name} ({agent.Role}): {summary}",
                "agent_action",
                agentName: agent.Name);

            // ── Parse created tasks ──
            var taskRegex = new Regex(@"<CREATE_TASK>[\s\S]*?<TITLE>(.*?)</TITLE>[\s\S]*?<DESCRIPTION>(.*?)</DESCRIPTION>[\s\S]*?</CREATE_TASK>", RegexOptions.IgnoreCase);
            var taskMatches = taskRegex.Matches(response);
            if (taskMatches.Count > 0)
            {
                using var scope = _serviceProvider.CreateScope();
                var taskService = scope.ServiceProvider.GetRequiredService<ITaskService>();

                foreach (Match match in taskMatches)
                {
                    var title = match.Groups[1].Value.Trim();
                    var description = match.Groups[2].Value.Trim();
                    
                    await taskService.CreateTaskAsync(title, description, agent.SubsidiaryId, agent.Id);
                    
                    await _activityLog.AddLogAsync(
                        $"[Heartbeat Task Created] {agent.Name} autonomously spawned task: {title}",
                        "success",
                        agentName: agent.Name);
                }
            }

            // ── Parse and persist new memories written by the agent ──
            var memRegex = new Regex(
                @"<MEMORY>[\s\S]*?<CATEGORY>(.*?)</CATEGORY>[\s\S]*?<KEY>(.*?)</KEY>[\s\S]*?<VALUE>(.*?)</VALUE>(?:[\s\S]*?<AUDIENCE>(.*?)</AUDIENCE>)?[\s\S]*?</MEMORY>",
                RegexOptions.IgnoreCase);
            var memMatches = memRegex.Matches(response);
            foreach (Match m in memMatches)
            {
                var category = m.Groups[1].Value.Trim().ToLower();
                var key      = m.Groups[2].Value.Trim();
                var value    = m.Groups[3].Value.Trim();
                var audience = m.Groups[4].Success && !string.IsNullOrWhiteSpace(m.Groups[4].Value)
                    ? m.Groups[4].Value.Trim().ToLower()
                    : agent.Role.ToLower();

                if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value)) continue;

                await _memoryBook.AddAsync(new MemoryEntry
                {
                    OwnerId    = agent.Id,
                    OwnerName  = agent.Name,
                    Audience   = audience,
                    Category   = category,
                    Key        = key,
                    Value      = value,
                    Source     = "heartbeat",
                    Pinned     = false,
                }, ct);

                await _activityLog.AddLogAsync(
                    $"[Memory Written] {agent.Name} stored memory: \"{key}\"",
                    "info",
                    agentName: agent.Name);
            }
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            logEntry.Success      = false;
            logEntry.ErrorMessage = ex.Message;

            // Reset agent status even on failure
            agent.Status          = "idle";
            agent.LastHeartbeatAt = DateTime.UtcNow.ToString("o");
            agent.NextHeartbeatAt = DateTime.UtcNow
                .AddMinutes(agent.HeartbeatIntervalMinutes)
                .ToString("o");
            await _agentRepo.SaveAsync(agent);

            await _activityLog.AddLogAsync(
                $"[Heartbeat ERROR] {agent.Name}: {ex.Message}",
                "warning",
                agentName: agent.Name);
        }

        await _logRepo.SaveAsync(logEntry);
        return logEntry;
    }

    // ── Logs ───────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<HeartbeatLog>> GetLogsAsync(
        string agentId,
        int    limit = 20,
        CancellationToken ct = default)
    {
        var all = await _logRepo.GetAllAsync();
        return all
            .Where(l => l.AgentId == agentId)
            .OrderByDescending(l => l.Timestamp)
            .Take(limit);
    }

    public async Task ClearLogsAsync(string agentId, CancellationToken ct = default)
    {
        var logs = await _logRepo.GetAllAsync();
        var toDelete = logs.Where(l => l.AgentId == agentId).ToList();
        foreach (var log in toDelete)
            await _logRepo.DeleteAsync(log.Id);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private static string BuildSystemPrompt(Agent agent, string memoryContext = "")
    {
        var skills = agent.RoleDefinition is not null
            ? string.Join(", ", agent.RoleDefinition.CommonSkills.Take(5))
            : "General AI Capabilities";

        var memorySection = string.IsNullOrWhiteSpace(memoryContext)
            ? string.Empty
            : $"""

              {memoryContext}
              """;

        return $"""
                You are {agent.Name}, an autonomous AI agent with the role of {agent.Role}.
                Core skills: {skills}.
                Base instructions: {agent.Instructions}
                {memorySection}
                You have been woken up by your autonomous heartbeat scheduler.
                Respond concisely and professionally. Focus on actionable observations.

                If you identify work that needs to be done, you can proactively create a task by outputting:
                <CREATE_TASK>
                <TITLE>Task Title</TITLE>
                <DESCRIPTION>Task Description</DESCRIPTION>
                </CREATE_TASK>
                You can output this multiple times if you need to create multiple tasks.

                If you learn something important that should be remembered, persist it using:
                <MEMORY>
                <CATEGORY>lesson|fact|decision|goal|preference|project|person|company</CATEGORY>
                <KEY>Short label for this memory</KEY>
                <VALUE>The full memory content</VALUE>
                <AUDIENCE>global|role-name|subsidiary-id</AUDIENCE>
                </MEMORY>
                You can write multiple memory entries.
                """;
    }
}
