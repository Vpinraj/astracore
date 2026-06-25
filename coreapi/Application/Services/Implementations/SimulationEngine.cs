using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace CoreApi.Application.Services.Implementations;

public class SimulationEngine : ISimulationEngine
{
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<ActivityLog> _logRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;
    private readonly ILeadService _leadService;
    private readonly IEmployeeService _employeeService;
    private readonly IRepository<CatalogItem> _catalogRepository;
    private readonly IRepository<RoleBlueprint> _roleBlueprintRepository;
    private readonly IServiceProvider _serviceProvider;

    private static readonly Dictionary<string, List<string>> AGENT_THOUGHTS = new(StringComparer.OrdinalIgnoreCase)
    {
        { "CEO", new() {
            "Refining organizational roadmap...",
            "Reviewing quarterly metrics and agent efficiency...",
            "Drafting partnership proposals with external APIs...",
            "Strategizing long-term investment vectors...",
            "Evaluating subsidiary contribution metrics..."
        }},
        { "CFO", new() {
            "Balancing the ledger and tracking server costs...",
            "Auditing token spend and operational overhead...",
            "Drafting financial summaries for the Director...",
            "Optimizing capital allocation across active projects...",
            "Forecasting profit margins and task yield rates..."
        }},
        { "CTO", new() {
            "Reviewing system architecture parameters...",
            "Optimizing token execution latency...",
            "Configuring agent pipeline standard integrations...",
            "Assessing tech debt in AI code generators...",
            "Refining data storage protocols for high throughput..."
        }},
        { "CMO", new() {
            "Analyzing audience acquisition metrics...",
            "Drafting content calendar and agent promotional campaigns...",
            "A/B testing user engagement copy...",
            "Structuring brand positioning guidelines...",
            "Optimizing SEO keywords and referral loops..."
        }},
        { "Product Manager", new() {
            "Mapping user stories to development sprints...",
            "Prioritizing feature backlog based on ROI projections...",
            "Conducting competitor dashboard reviews...",
            "Defining acceptance criteria for pending milestones...",
            "Synthesizing feedback from customer agent logs..."
        }},
        { "Developer", new() {
            "Refactoring API route handlers...",
            "Writing unit tests for agent execution queues...",
            "Debugging concurrent state updates...",
            "Optimizing SQL queries and caching layer...",
            "Deploying hotfixes to serverless containers..."
        }},
        { "UI Designer", new() {
            "Polishing glassmorphic layout tokens...",
            "Designing glowing button states and active hover micro-interactions...",
            "Creating high-fidelity vector layouts for the client portal...",
            "Optimizing visual hierarchy and loading skeletons...",
            "Establishing cohesive typography scale..."
        }},
        { "Marketer", new() {
            "Writing newsletter copy for product updates...",
            "Monitoring click-through ratios on active channels...",
            "Setting up keyword campaigns for AI integration tools...",
            "Curating community showcase threads...",
            "Engaging target audiences on social forums..."
        }},
        { "QA Engineer", new() {
            "Executing end-to-end integration test suites...",
            "Writing regression tests for the chat processor...",
            "Conducting performance stress tests on database clusters...",
            "Filing bug tickets for styling inconsistencies...",
            "Verifying API response contracts..."
        }},
        { "Customer Support", new() {
            "Resolving user ticketing logs...",
            "Drafting knowledge base articles for setup anomalies...",
            "Triage of incident reports from active client nodes...",
            "Synthesizing customer satisfaction indexes...",
            "Following up on service SLA escalations..."
        }}
    };

    public SimulationEngine(
        IRepository<Subsidiary> subsidiaryRepository,
        IRepository<Agent> agentRepository,
        IRepository<TaskItem> taskRepository,
        IRepository<ActivityLog> logRepository,
        ILogService logService,
        ITransactionService transactionService,
        ILeadService leadService,
        IEmployeeService employeeService,
        IRepository<CatalogItem> catalogRepository,
        IRepository<RoleBlueprint> roleBlueprintRepository,
        IServiceProvider serviceProvider)
    {
        _subsidiaryRepository = subsidiaryRepository;
        _agentRepository = agentRepository;
        _taskRepository = taskRepository;
        _logRepository = logRepository;
        _logService = logService;
        _transactionService = transactionService;
        _leadService = leadService;
        _employeeService = employeeService;
        _catalogRepository = catalogRepository;
        _roleBlueprintRepository = roleBlueprintRepository;
        _serviceProvider = serviceProvider;
    }

    public async Task<SimulationState> GetStateAsync()
    {
        var subsidiaries = (await _subsidiaryRepository.GetAllAsync()).ToList();

        if (!subsidiaries.Any())
        {
            return await SeedDefaultStateAsync();
        }

        var agents = (await _agentRepository.GetAllAsync()).ToList();
        var tasks = (await _taskRepository.GetAllAsync()).Where(t => t.Status != "deleted").ToList();
        var logs = (await _logRepository.GetAllAsync()).OrderByDescending(l => l.Id).ToList();
        var transactions = (await _transactionService.GetAllAsync()).OrderByDescending(t => t.Timestamp).ToList();
        var leads = (await _leadService.GetAllAsync()).ToList();
        var employees = (await _employeeService.GetAllAsync()).ToList();
        var catalog = (await _catalogRepository.GetAllAsync()).ToList();
        var roles = (await _roleBlueprintRepository.GetAllAsync()).ToList();

        return new SimulationState
        {
            Subsidiaries = subsidiaries,
            Agents = agents,
            Tasks = tasks,
            Logs = logs,
            Transactions = transactions,
            Leads = leads,
            Employees = employees,
            Catalog = catalog,
            RoleBlueprints = roles
        };
    }

    public async Task SaveStateAsync(SimulationState state)
    {
        // 1. Sync Subsidiaries
        var currentSubs = (await _subsidiaryRepository.GetAllAsync()).ToList();
        foreach (var sub in currentSubs)
        {
            if (!state.Subsidiaries.Any(s => s.Id == sub.Id))
                await _subsidiaryRepository.DeleteAsync(sub.Id);
        }
        foreach (var sub in state.Subsidiaries)
        {
            await _subsidiaryRepository.SaveAsync(sub);
        }

        // 2. Sync Agents
        var currentAgents = (await _agentRepository.GetAllAsync()).ToList();
        foreach (var agent in currentAgents)
        {
            if (!state.Agents.Any(a => a.Id == agent.Id))
                await _agentRepository.DeleteAsync(agent.Id);
        }
        foreach (var agent in state.Agents)
        {
            await _agentRepository.SaveAsync(agent);
        }

        // 3. Sync Tasks
        var currentTasks = (await _taskRepository.GetAllAsync()).ToList();
        foreach (var task in currentTasks)
        {
            if (!state.Tasks.Any(t => t.Id == task.Id))
                await _taskRepository.DeleteAsync(task.Id);
        }
        foreach (var task in state.Tasks)
        {
            await _taskRepository.SaveAsync(task);
        }

        // 4. Sync Logs
        var currentLogs = (await _logRepository.GetAllAsync()).ToList();
        foreach (var log in currentLogs)
        {
            if (!state.Logs.Any(l => l.Id == log.Id))
                await _logRepository.DeleteAsync(log.Id);
        }
        foreach (var log in state.Logs)
        {
            await _logRepository.SaveAsync(log);
        }

        // 5. Sync Catalog
        var currentCatalog = (await _catalogRepository.GetAllAsync()).ToList();
        foreach (var item in currentCatalog)
        {
            if (!state.Catalog.Any(c => c.Id == item.Id))
                await _catalogRepository.DeleteAsync(item.Id);
        }
        foreach (var item in state.Catalog)
        {
            await _catalogRepository.SaveAsync(item);
        }

        // 6. Sync RoleBlueprints
        var currentRoles = (await _roleBlueprintRepository.GetAllAsync()).ToList();
        foreach (var role in currentRoles)
        {
            if (!state.RoleBlueprints.Any(r => r.Id == role.Id))
                await _roleBlueprintRepository.DeleteAsync(role.Id);
        }
        foreach (var role in state.RoleBlueprints)
        {
            await _roleBlueprintRepository.SaveAsync(role);
        }
    }

    public async Task<SimulationState> ResetStateAsync()
    {
        // Clear all collections
        var subsidiaries = await _subsidiaryRepository.GetAllAsync();
        foreach (var item in subsidiaries) await _subsidiaryRepository.DeleteAsync(item.Id);

        var agents = await _agentRepository.GetAllAsync();
        foreach (var item in agents) await _agentRepository.DeleteAsync(item.Id);

        var tasks = await _taskRepository.GetAllAsync();
        foreach (var item in tasks) await _taskRepository.DeleteAsync(item.Id);

        await _logService.ClearAllAsync();
        await _transactionService.ClearAllAsync();
        await _leadService.ClearAllAsync();
        await _employeeService.ClearAllAsync();

        var catalogItems = await _catalogRepository.GetAllAsync();
        foreach (var item in catalogItems) await _catalogRepository.DeleteAsync(item.Id);

        var roles = await _roleBlueprintRepository.GetAllAsync();
        foreach (var item in roles) await _roleBlueprintRepository.DeleteAsync(item.Id);

        return await SeedDefaultStateAsync();
    }

    public async Task<SimulationState> TickAsync()
    {
        var subsidiaries = (await _subsidiaryRepository.GetAllAsync()).ToList();
        var agents = (await _agentRepository.GetAllAsync()).ToList();
        var tasks = (await _taskRepository.GetAllAsync()).ToList();

        var random = new Random();

        foreach (var task in tasks.Where(t => t.Status.Equals("in_progress", StringComparison.OrdinalIgnoreCase)))
        {
            var agent = agents.FirstOrDefault(a => a.Id == task.AssignedAgentId);
            var sub = subsidiaries.FirstOrDefault(s => s.Id == task.SubsidiaryId);

            if (agent == null) continue;

            // Wait for LLM to complete the task
            if (task.Progress < 99)
            {
                // Progress is updated by TaskProcessorService when the LLM finishes
            }
            else if (task.Progress >= 100)
            {
                // Task is completed by LLM
                task.Status = "completed";
                task.Logs.Add($"Task completed successfully.");
                if (!string.IsNullOrWhiteSpace(task.Output))
                {
                    task.Logs.Add($"Agent Output: {task.Output}");
                }

                if (sub != null)
                {
                    // Random generation of procurements and leads has been disabled.
                }

                agent.Status = "idle";
                agent.ActiveTaskId = null;
                agent.Level += 1;
                await _agentRepository.SaveAsync(agent);

                await _logService.AddLogAsync(
                    $"SUCCESS: {agent.Name} ({agent.Role}) completed \"{task.Title}\".",
                    "success",
                    subsidiaryName: sub?.Name,
                    agentName: agent.Name
                );
            }

            await _taskRepository.SaveAsync(task);
        }

        // ── Ghost-task recovery: reset agents stuck on non-existent or completed tasks ──
        // This handles the case where a task was deleted (or the server restarted)
        // while an agent was still marked as "working" on it — preventing permanent dead-lock.
        var liveTaskIds = new HashSet<string>(tasks.Select(t => t.Id));
        var completedTaskIds = new HashSet<string>(tasks
            .Where(t => t.Status.Equals("completed", StringComparison.OrdinalIgnoreCase) || t.Status.Equals("deleted", StringComparison.OrdinalIgnoreCase))
            .Select(t => t.Id));

        var ghostAgents = agents.Where(a =>
            a.Status.Equals("working", StringComparison.OrdinalIgnoreCase) &&
            (
                string.IsNullOrWhiteSpace(a.ActiveTaskId) ||
                !liveTaskIds.Contains(a.ActiveTaskId) ||
                completedTaskIds.Contains(a.ActiveTaskId)
            )).ToList();

        foreach (var stuckAgent in ghostAgents)
        {
            var ghostTaskRef = stuckAgent.ActiveTaskId;
            stuckAgent.Status = "idle";
            stuckAgent.ActiveTaskId = null;
            await _agentRepository.SaveAsync(stuckAgent);
            await _logService.AddLogAsync(
                $"[Recovery] Agent {stuckAgent.Name} unstuck — referenced task '{ghostTaskRef}' no longer active.",
                "warning",
                agentName: stuckAgent.Name
            );
        }

        // ── Auto-pick: start any pending tasks whose assigned agent is now idle ──
        // This recovers tasks that were never started due to a race condition or
        // a transient error during the initial StartTask call.
        var pendingWithAgent = tasks.Where(t =>
            t.Status.Equals("pending", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(t.AssignedAgentId)).ToList();

        // Refresh agent list so we pick up any status changes made above (including ghost recovery)
        agents = (await _agentRepository.GetAllAsync()).ToList();

        foreach (var pendingTask in pendingWithAgent)
        {
            var assignedAgent = agents.FirstOrDefault(a =>
                a.Id == pendingTask.AssignedAgentId &&
                a.Status.Equals("idle", StringComparison.OrdinalIgnoreCase));

            if (assignedAgent == null) continue;

            try
            {
                // Mark agent and task as in_progress directly to avoid re-running StartTaskAsync's
                // full fund-deduction logic (already removed) and to keep the tick fast.
                assignedAgent.Status = "working";
                assignedAgent.ActiveTaskId = pendingTask.Id;
                await _agentRepository.SaveAsync(assignedAgent);

                pendingTask.Status = "in_progress";
                pendingTask.Logs.Add("Agent picked up task from queue. Running processes...");
                await _taskRepository.SaveAsync(pendingTask);

                await _logService.AddLogAsync(
                    $"Agent {assignedAgent.Name} ({assignedAgent.Role}) auto-picked task: \"{pendingTask.Title}\".",
                    "agent_action",
                    agentName: assignedAgent.Name
                );

                // Launch background LLM processing
                var taskId = pendingTask.Id;
                _ = System.Threading.Tasks.Task.Run(async () =>
                {
                    using var scope = _serviceProvider.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<ITaskProcessorService>();
                    await processor.ProcessTaskAsync(taskId);
                });
            }
            catch (Exception ex)
            {
                await _logService.AddLogAsync($"Auto-pick error for task {pendingTask.Id}: {ex.Message}", "warning");
            }
        }

        // Return refreshed state
        return await GetStateAsync();
    }

    private async Task<SimulationState> SeedDefaultStateAsync()
    {
        var seed = GetDefaultSeedState();

        foreach (var sub in seed.Subsidiaries)
            await _subsidiaryRepository.SaveAsync(sub);

        foreach (var agent in seed.Agents)
            await _agentRepository.SaveAsync(agent);

        foreach (var task in seed.Tasks)
            await _taskRepository.SaveAsync(task);

        foreach (var log in seed.Logs)
            await _logRepository.SaveAsync(log);

        return seed;
    }

    private SimulationState GetDefaultSeedState()
    {
        return new SimulationState
        {
            Subsidiaries = new List<Subsidiary>
            {
                new Subsidiary
                {
                    Id = "common",
                    Name = "Common HQ",
                    Industry = "Global Operations",
                    Investment = 0,
                    Balance = 0,
                    Expenses = 0,
                    Profits = 0,
                    Color = "from-zinc-700 to-slate-800",
                    BorderColor = "border-zinc-500/30",
                    TextColor = "text-zinc-400",
                    Icon = "Globe",
                    LogoUrl = "",
                    Website = "",
                    Email = "hq@astracore.internal",
                    Phone = "+91 80 4999 9999",
                    Description = "Shared resources and corporate treasury operations for all subsidiaries.",
                    Address = "Corporate HQ, MG Road, Bangalore, India",
                    BankDetails = "SBI - A/C: 30001234567, IFSC: SBIN0000001",
                    Procurements = 0,
                    Sales = 0
                }
            },
            Agents = new List<Agent>(),
            Tasks = new List<TaskItem>(),
            Logs = new List<ActivityLog>()
        };
    }
}
