using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Exceptions;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace CoreApi.Application.Services.Implementations;

public class TaskService : ITaskService
{
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;
    private readonly IServiceProvider _serviceProvider;

    public TaskService(
        IRepository<TaskItem> taskRepository,
        IRepository<Agent> agentRepository,
        IRepository<Subsidiary> subsidiaryRepository,
        ILogService logService,
        ITransactionService transactionService,
        IServiceProvider serviceProvider)
    {
        _taskRepository = taskRepository;
        _agentRepository = agentRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
        _transactionService = transactionService;
        _serviceProvider = serviceProvider;
    }

    public async Task<TaskItem> CreateTaskAsync(string title, string description, string subsidiaryId, string assignedAgentId, string attachedFileName = "", string attachedFileData = "")
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
            Duration = duration,
            Logs = new() { "Task pipeline initialized. Awaiting deployment..." },
            AttachedFileName = attachedFileName ?? string.Empty,
            AttachedFileData = attachedFileData ?? string.Empty
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

        // Cost logic removed

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
            $"Agent {agent.Name} ({agent.Role}) deployed to task: \"{task.Title}\".",
            "agent_action",
            subsidiaryName: subsidiary.Name,
            agentName: agent.Name
        );

        // Launch background LLM execution
        var taskIdToProcess = task.Id;
        _ = System.Threading.Tasks.Task.Run(async () =>
        {
            using var scope = _serviceProvider.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<ITaskProcessorService>();
            await processor.ProcessTaskAsync(taskIdToProcess);
        });
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
    public async Task DeleteAsync(string id)
    {
        var task = await _taskRepository.GetByIdAsync(id);
        if (task != null)
        {
            task.Status = "deleted";
            await _taskRepository.SaveAsync(task);
        }
    }

    public async Task UpdateTaskAsync(string taskId, string title, string description, string assignedAgentId)
    {
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null) throw new EntityNotFoundException(nameof(TaskItem), taskId);

        bool agentChanged = task.AssignedAgentId != assignedAgentId;

        task.Title = title;
        task.Description = description;

        if (agentChanged)
        {
            if (!string.IsNullOrWhiteSpace(assignedAgentId))
            {
                var agent = await _agentRepository.GetByIdAsync(assignedAgentId);
                if (agent == null)
                {
                    throw new EntityNotFoundException(nameof(Agent), assignedAgentId);
                }
            }
            task.AssignedAgentId = assignedAgentId;
        }

        await _taskRepository.SaveAsync(task);

        if (agentChanged && task.Status.Equals("pending", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(assignedAgentId))
        {
            var newAgent = await _agentRepository.GetByIdAsync(assignedAgentId);
            if (newAgent != null && newAgent.Status.Equals("idle", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    await StartTaskAsync(task.Id);
                }
                catch (Exception)
                {
                    // Ignore
                }
            }
        }
    }

    public async Task ResumeTaskAsync(string taskId, string answer)
    {
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null || task.Status != "blocked_on_user") return;

        task.Description += $"\n\n[Agent Asked]: {task.PendingQuestion}\n[User Answered]: {answer}\n[System]: Please continue processing your task.";
        task.PendingAnswer = answer;
        task.PendingQuestion = string.Empty;
        task.Status = "in_progress";
        task.Logs.Add("User provided answer. Resuming execution...");
        
        await _taskRepository.SaveAsync(task);

        // Resume background LLM execution
        var resumeTaskId = task.Id;
        _ = System.Threading.Tasks.Task.Run(async () =>
        {
            using var scope = _serviceProvider.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<ITaskProcessorService>();
            await processor.ProcessTaskAsync(resumeTaskId);
        });
    }

    public async Task AddDiscussionMessageAsync(string taskId, string content, string senderName, string role = "user")
    {
        var task = await _taskRepository.GetByIdAsync(taskId);
        if (task == null) throw new EntityNotFoundException(nameof(TaskItem), taskId);

        var msg = new TaskDiscussionMessage
        {
            Role = role,
            Content = content,
            SenderName = senderName,
            Timestamp = DateTimeOffset.UtcNow.ToString("O")
        };

        task.Discussion.Add(msg);
        await _taskRepository.SaveAsync(task);

        if (role.Equals("user", StringComparison.OrdinalIgnoreCase))
        {
            _ = System.Threading.Tasks.Task.Run(async () =>
            {
                using var scope = _serviceProvider.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<ITaskProcessorService>();
                await processor.ProcessDiscussionAsync(taskId);
            });
        }
    }
}
