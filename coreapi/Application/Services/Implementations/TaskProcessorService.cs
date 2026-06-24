using System;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using coreapi.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace CoreApi.Application.Services.Implementations;

public class TaskProcessorService : ITaskProcessorService
{
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<CoreApi.Core.Entities.Agent> _agentRepository;
    private readonly IKernelProviderService _kernelProviderService;
    private readonly ILogService _logService;

    public TaskProcessorService(
        IRepository<TaskItem> taskRepository,
        IRepository<CoreApi.Core.Entities.Agent> agentRepository,
        IKernelProviderService kernelProviderService,
        ILogService logService)
    {
        _taskRepository = taskRepository;
        _agentRepository = agentRepository;
        _kernelProviderService = kernelProviderService;
        _logService = logService;
    }

    public async Task ProcessTaskAsync(string taskId)
    {
        try
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null) return;

            var agent = await _agentRepository.GetByIdAsync(task.AssignedAgentId);
            if (agent == null) return;

            // Log that the background process actually started the LLM inference
            await _logService.AddLogAsync(
                $"Background LLM inference started for task {task.Title} by agent {agent.Name}.",
                "info",
                agentName: agent.Name
            );

            var kernel = _kernelProviderService.CreateKernel(agent.ModelId, task.SubsidiaryId);

            var skAgent = new ChatCompletionAgent
            {
                Name = agent.Name.Replace(" ", "_"),
                Instructions = $"You are {agent.Name}, a {agent.Role}. {agent.Instructions}\nProcess the following assigned task and output your final deliverable.",
                Kernel = kernel,
                Arguments = new KernelArguments(new OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() 
                })
            };

            var chatHistory = new ChatHistory();
            string prompt = $"Task Title: {task.Title}\n\nTask Description: {task.Description}\n\nPlease execute this task and provide the complete output. If you have any clarifying questions or doubts that block your progress, you can use the AskQuestionToUser tool.";
            
            chatHistory.AddUserMessage(prompt);

            string outputText = string.Empty;
            bool isBlocked = false;

            try
            {
                await foreach (var message in skAgent.InvokeAsync(chatHistory))
                {
                    if (message.Message != null && !string.IsNullOrEmpty(message.Message.Content))
                    {
                        var content = message.Message.Content;
                        outputText += content + "\n";

                        if (content.Contains("[BLOCKING_QUESTION]:"))
                        {
                            isBlocked = true;
                            // Extract the question
                            var questionIndex = content.IndexOf("[BLOCKING_QUESTION]:") + "[BLOCKING_QUESTION]:".Length;
                            var question = content.Substring(questionIndex).Trim();
                            
                            task = await _taskRepository.GetByIdAsync(taskId);
                            if (task != null)
                            {
                                task.Status = "blocked_on_user";
                                task.PendingQuestion = question;
                                await _taskRepository.SaveAsync(task);
                            }
                            break; // Stop processing further
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                outputText += $"\nError during LLM execution: {ex.Message}";
            }

            if (!isBlocked)
            {
                // Reload the task to avoid overriding any concurrent simulation tick changes
                task = await _taskRepository.GetByIdAsync(taskId);
                if (task != null && task.Status != "blocked_on_user")
                {
                    task.Output = string.IsNullOrWhiteSpace(task.Output) ? outputText.Trim() : task.Output + "\n" + outputText.Trim();
                    task.Progress = 100;
                    await _taskRepository.SaveAsync(task);
                }
            }
        }
        catch (Exception ex)
        {
            await _logService.AddLogAsync($"TaskProcessorService Error: {ex.Message}", "warning");
        }
    }
}
