using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CoreApi.Application.Services.Implementations;

/// <summary>
/// Long-running BackgroundService that autonomously wakes agents on their scheduled heartbeat.
///
/// Design decisions (production-grade):
/// ─────────────────────────────────────────────────────────────────────────────
///  • Uses <see cref="IServiceScopeFactory"/> to resolve scoped/transient
///    dependencies per tick — avoids captive-dependency bugs with Singletons.
///  • Uses a <see cref="SemaphoreSlim"/> per-agent to prevent overlapping
///    concurrent LLM calls for the same agent if a tick takes longer than the
///    next scan interval.
///  • Respects <see cref="CancellationToken"/> on every async boundary so
///    the app shuts down cleanly within the 5-second graceful period.
///  • All exceptions are swallowed at the worker level (logged) so a single
///    bad agent never brings down the entire worker loop.
///  • Scan interval is 30 seconds — short enough for a 1-minute minimum
///    heartbeat, cheap enough to not tax the DB.
/// </summary>
public sealed class AgentHeartbeatWorker : BackgroundService
{
    private static readonly TimeSpan ScanInterval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AgentHeartbeatWorker> _logger;

    // Tracks which agents are currently executing a heartbeat to prevent overlap
    private readonly System.Collections.Concurrent.ConcurrentDictionary<string, byte> _inFlight
        = new();

    public AgentHeartbeatWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<AgentHeartbeatWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AgentHeartbeatWorker started. Scan interval: {Interval}s",
            ScanInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ScanAndDispatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Normal shutdown — break out cleanly
                break;
            }
            catch (Exception ex)
            {
                // Log and continue — worker must not crash
                _logger.LogError(ex, "AgentHeartbeatWorker: unhandled exception during scan. Retrying in {Interval}s.",
                    ScanInterval.TotalSeconds);
            }

            await Task.Delay(ScanInterval, stoppingToken);
        }

        _logger.LogInformation("AgentHeartbeatWorker stopped.");
    }

    // ── Core scan logic ────────────────────────────────────────────────────────

    private async Task ScanAndDispatchAsync(CancellationToken ct)
    {
        // Each scan creates a fresh scope so services are properly lifecycle-managed
        using var scope      = _scopeFactory.CreateScope();
        var agentRepo        = scope.ServiceProvider.GetRequiredService<IRepository<Agent>>();
        var heartbeatService = scope.ServiceProvider.GetRequiredService<IHeartbeatService>();

        var now    = DateTime.UtcNow;
        var agents = (await agentRepo.GetAllAsync()).ToList();

        var dueAgents = agents.Where(a =>
            a.HeartbeatEnabled &&
            !string.IsNullOrWhiteSpace(a.NextHeartbeatAt) &&
            DateTime.TryParse(a.NextHeartbeatAt, null, System.Globalization.DateTimeStyles.RoundtripKind, out var next) &&
            next <= now &&
            a.Status == "idle"   // Only fire if agent is not already busy
        ).ToList();

        if (dueAgents.Count == 0) return;

        _logger.LogInformation("AgentHeartbeatWorker: {Count} agent(s) due for heartbeat pulse.", dueAgents.Count);

        // Fire each due agent's heartbeat in parallel (but guard against overlap)
        var tasks = dueAgents
            .Where(a => _inFlight.TryAdd(a.Id, 0)) // Skip if already in flight
            .Select(agent => DispatchPulseAsync(agent, heartbeatService, ct));

        await Task.WhenAll(tasks);
    }

    private async Task DispatchPulseAsync(
        Agent agent,
        IHeartbeatService heartbeatService,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation(
                "AgentHeartbeatWorker: firing heartbeat for agent {Name} ({Role}).",
                agent.Name, agent.Role);

            // Each pulse creates its own scope for safety
            using var scope = _scopeFactory.CreateScope();
            var svc         = scope.ServiceProvider.GetRequiredService<IHeartbeatService>();
            var agentRepo   = scope.ServiceProvider.GetRequiredService<IRepository<Agent>>();

            // Re-read the agent from DB to get the very latest state
            var freshAgent = await agentRepo.GetByIdAsync(agent.Id);
            if (freshAgent is null || !freshAgent.HeartbeatEnabled || freshAgent.Status != "idle")
            {
                _logger.LogDebug(
                    "AgentHeartbeatWorker: skipping {Name} — state changed before pulse could start.",
                    agent.Name);
                return;
            }

            var log = await svc.ExecutePulseAsync(freshAgent, ct);

            _logger.LogInformation(
                "AgentHeartbeatWorker: heartbeat pulse complete for {Name}. Success={Success}",
                agent.Name, log.Success);
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogError(ex,
                "AgentHeartbeatWorker: pulse failed for agent {Id} ({Name}).",
                agent.Id, agent.Name);
        }
        finally
        {
            // Always release the in-flight lock
            _inFlight.TryRemove(agent.Id, out _);
        }
    }
}
