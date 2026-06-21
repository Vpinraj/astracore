using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Exceptions;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class TaskService : ITaskService
{
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;

    public TaskService(
        IRepository<TaskItem> taskRepository,
        IRepository<Agent> agentRepository,
        IRepository<Subsidiary> subsidiaryRepository,
        ILogService logService,
        ITransactionService transactionService)
    {
        _taskRepository = taskRepository;
        _agentRepository = agentRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
        _transactionService = transactionService;
    }

    public async Task<TaskItem> CreateTaskAsync(string title, string description, string subsidiaryId, string assignedAgentId, double payout, double cost)
    {
        var random = new Random();
        var duration = 10 + random.Next(15);

        var task = new TaskItem
        {
            Id = $"task-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Title = title,
            Description = description,
            AssignedAgentId = assignedAgentId ?? string.Empty,
            SubsidiaryId = subsidiaryId,
            Status = "pending",
            Progress = 0,
            Payout = payout,
            Cost = cost,
            Duration = duration,
            Logs = new() { "Task pipeline initialized. Awaiting deployment..." }
        };

        await _taskRepository.SaveAsync(task);

        // Auto-start task if agent is idle
        if (!string.IsNullOrWhiteSpace(assignedAgentId))
        {
            var agent = await _agentRepository.GetByIdAsync(assignedAgentId);
            if (agent != null && agent.Status.Equals("idle", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    await StartTaskAsync(task.Id);
                }
                catch (Exception)
                {
                    // If it fails (e.g. funds), task remains pending.
                }
            }
        }

        return task;
    }

    public async Task StartTaskAsync(string taskId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null)
        {
            throw new EntityNotFoundException(nameof(TaskItem), taskId);
        }

        if (string.IsNullOrWhiteSpace(task.AssignedAgentId))
        {
            throw new InvalidOperationException("Cannot start task without an assigned agent.");
        }

        var agent = await _agentRepository.GetByIdAsync(task.AssignedAgentId);
        if (agent == null)
        {
            throw new EntityNotFoundException(nameof(Agent), task.AssignedAgentId);
        }

        var subsidiary = await _subsidiaryRepository.GetByIdAsync(task.SubsidiaryId);
        if (subsidiary == null)
        {
            throw new EntityNotFoundException(nameof(Subsidiary), task.SubsidiaryId);
        }

        if (task.Status.Equals("in_progress", StringComparison.OrdinalIgnoreCase))
        {
            return; // Already started
        }

        if (!agent.Status.Equals("idle", StringComparison.OrdinalIgnoreCase))
        {
            throw new AgentBusyException($"Agent {agent.Name} is currently busy working on another node stream.");
        }

        if (subsidiary.Balance < task.Cost)
        {
            throw new InsufficientFundsException($"Insufficient funds in {subsidiary.Name} (₹{subsidiary.Balance:N0}) to deploy this task (Requires ₹{task.Cost:N0}).");
        }

        // Deduct cost
        if (task.Cost > 0)
        {
            double subtotal = Math.Round(task.Cost / 1.18, 2);
            double tax = Math.Round(subtotal * 0.09, 2);
            double diff = task.Cost - (subtotal + tax + tax);
            subtotal += diff;

            await _transactionService.RecordTransactionAsync(
                subsidiaryId: task.SubsidiaryId,
                type: "Expense",
                subtotal: subtotal,
                discount: 0,
                cgst: tax,
                sgst: tax,
                totalAmount: task.Cost,
                amountPaidOrReceived: task.Cost,
                description: $"Deployed Task Cost: {task.Title}",
                referenceNumber: $"INV-TSK-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100000}",
                partnerName: "Operations HQ",
                processedByAgentId: agent.Id
            );
        }

        // Update Agent
        agent.Status = "working";
        agent.ActiveTaskId = task.Id;
        await _agentRepository.SaveAsync(agent);

        // Update Task
        task.Status = "in_progress";
        task.Logs.Add("Agent started execution. Running processes...");
        await _taskRepository.SaveAsync(task);

        // Log transition
        await _logService.AddLogAsync(
            $"Agent {agent.Name} ({agent.Role}) deployed to task: \"{task.Title}\". Allocated operational budget: ₹{task.Cost:N0}.",
            "agent_action",
            subsidiaryName: subsidiary.Name,
            agentName: agent.Name
        );
    }

    public async Task AssignAgentAsync(string taskId, string agentId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null)
        {
            throw new EntityNotFoundException(nameof(TaskItem), taskId);
        }

        var agent = await _agentRepository.GetByIdAsync(agentId);
        if (agent == null)
        {
            throw new EntityNotFoundException(nameof(Agent), agentId);
        }

        task.AssignedAgentId = agentId;
        await _taskRepository.SaveAsync(task);

        if (task.Status.Equals("pending", StringComparison.OrdinalIgnoreCase) && agent.Status.Equals("idle", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await StartTaskAsync(task.Id);
            }
            catch (Exception)
            {
                // If starting fails (e.g., funds), task remains pending with the agent assigned.
            }
        }
    }

    public Task<IEnumerable<TaskItem>> GetAllAsync() => _taskRepository.GetAllAsync();
    public Task<TaskItem?> GetByIdAsync(string id) => _taskRepository.GetByIdAsync(id);
    public Task SaveAsync(TaskItem task) => _taskRepository.SaveAsync(task);
    public Task DeleteAsync(string id) => _taskRepository.DeleteAsync(id);
}
