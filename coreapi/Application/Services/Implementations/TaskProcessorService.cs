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
            var msgContentItems = new ChatMessageContentItemCollection();
            string prompt = $"Task Title: {task.Title}\n\nTask Description: {task.Description}\n\nPlease execute this task and provide the complete output. If you have any clarifying questions or doubts that block your progress, you can use the AskQuestionToUser tool.";
            msgContentItems.Add(new TextContent(prompt));

            if (!string.IsNullOrWhiteSpace(task.AttachedFileData))
            {
                if (task.AttachedFileData.StartsWith("data:image/"))
                {
                    var commaIndex = task.AttachedFileData.IndexOf(',');
                    var mimeType = task.AttachedFileData.Substring(5, task.AttachedFileData.IndexOf(';') - 5);
                    var base64Data = task.AttachedFileData.Substring(commaIndex + 1);
                    var imageBytes = Convert.FromBase64String(base64Data);
                    msgContentItems.Add(new ImageContent(new ReadOnlyMemory<byte>(imageBytes), mimeType));
                }
                else
                {
                    var base64Data = task.AttachedFileData.Contains(",") ? task.AttachedFileData.Substring(task.AttachedFileData.IndexOf(",") + 1) : task.AttachedFileData;
                    try
                    {
                        var textData = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64Data));
                        msgContentItems.Add(new TextContent($"\n--- Attached File: {task.AttachedFileName} ---\n{textData}\n--- End Attached File ---"));
                    }
                    catch
                    {
                        msgContentItems.Add(new TextContent($"\n[Attached File {task.AttachedFileName} provided but could not be parsed as text]"));
                    }
                }
            }

            chatHistory.Add(new ChatMessageContent(AuthorRole.User, msgContentItems));

            string oldOutput = task.Output ?? string.Empty;
            string outputText = string.Empty;
            bool isBlocked = false;
            int tokenCount = 0;

            try
            {
                task = await _taskRepository.GetByIdAsync(taskId);
                if (task != null) {
                    task.Progress = 10;
                    await _taskRepository.SaveAsync(task);
                }

                await foreach (var message in skAgent.InvokeStreamingAsync(chatHistory))
                {
                    if (message.Message != null && message.Message.Content != null)
                    {
                        var content = message.Message.Content;
                        outputText += content;
                        tokenCount++;

                        if (outputText.Contains("[BLOCKING_QUESTION]:"))
                        {
                            isBlocked = true;
                            // Extract the question
                            var questionIndex = outputText.IndexOf("[BLOCKING_QUESTION]:") + "[BLOCKING_QUESTION]:".Length;
                            var question = outputText.Substring(questionIndex).Trim();
                            
                            task = await _taskRepository.GetByIdAsync(taskId);
                            if (task != null)
                            {
                                task.Status = "blocked_on_user";
                                task.PendingQuestion = question;
                                await _taskRepository.SaveAsync(task);
                            }
                            break; // Stop processing further
                        }

                        // Periodically update progress and output so frontend sees it live
                        if (!isBlocked && tokenCount % 15 == 0)
                        {
                            task = await _taskRepository.GetByIdAsync(taskId);
                            if (task != null && task.Status != "blocked_on_user")
                            {
                                task.Output = string.IsNullOrWhiteSpace(oldOutput) ? outputText : oldOutput + "\n" + outputText;
                                task.Progress = Math.Min(90, 10 + (tokenCount / 4));
                                await _taskRepository.SaveAsync(task);
                            }
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
                    task.Output = string.IsNullOrWhiteSpace(oldOutput) ? outputText.Trim() : oldOutput + "\n" + outputText.Trim();
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
