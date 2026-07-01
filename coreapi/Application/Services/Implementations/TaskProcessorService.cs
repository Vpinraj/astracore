using System;
using System.Linq;
using System.Text.RegularExpressions;
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
    private readonly IMemoryBookService _memoryBook;

    public TaskProcessorService(
        IRepository<TaskItem> taskRepository,
        IRepository<CoreApi.Core.Entities.Agent> agentRepository,
        IKernelProviderService kernelProviderService,
        ILogService logService,
        IMemoryBookService memoryBook)
    {
        _taskRepository = taskRepository;
        _agentRepository = agentRepository;
        _kernelProviderService = kernelProviderService;
        _logService = logService;
        _memoryBook = memoryBook;
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

            // ── Inject Memory Book context ──
            var memoryContext = await _memoryBook.GetContextSnapshotAsync(agent);
            var memorySection = string.IsNullOrWhiteSpace(memoryContext) ? string.Empty
                : $"\n\n{memoryContext}\n\nIf you learn something important during this task, you can persist it using:\n<MEMORY>\n<CATEGORY>lesson|fact|decision|goal|preference|project|person|company</CATEGORY>\n<KEY>Short label</KEY>\n<VALUE>The memory content</VALUE>\n<AUDIENCE>global|role-name|subsidiary-id</AUDIENCE>\n</MEMORY>";

            var agentInstructions = $"You are {agent.Name}, a {agent.Role}. {agent.Instructions}{memorySection}\nProcess the following assigned task and output your final deliverable.";

            var skAgent = new ChatCompletionAgent
            {
                Name = agent.Name.Replace(" ", "_"),
                Instructions = agentInstructions,
                Kernel = kernel,
                Arguments = new KernelArguments(new OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() 
                })
            };

            var skAgentFallback = new ChatCompletionAgent
            {
                Name = agent.Name.Replace(" ", "_"),
                Instructions = agentInstructions,
                Kernel = kernel,
                Arguments = new KernelArguments(new OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = FunctionChoiceBehavior.None() 
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
                // If it fails with invalid tool call arguments or similar, try a fallback without tools
                if (ex.Message.Contains("400") || ex.Message.Contains("invalid_request_error"))
                {
                    try
                    {
                        var fallbackOutput = "";
                        await foreach (var message in skAgentFallback.InvokeAsync(chatHistory))
                        {
                            fallbackOutput += message.Message.Content;
                        }
                        outputText += fallbackOutput;
                    }
                    catch (Exception fallbackEx)
                    {
                        outputText += $"\nError during LLM execution (Fallback): {fallbackEx.Message}";
                    }
                }
                else
                {
                    outputText += $"\nError during LLM execution: {ex.Message}";
                }
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

            // ── Parse and persist memories written by the agent during task execution ──
            var memRegex = new Regex(
                @"<MEMORY>[\s\S]*?<CATEGORY>(.*?)<\/CATEGORY>[\s\S]*?<KEY>(.*?)<\/KEY>[\s\S]*?<VALUE>(.*?)<\/VALUE>(?:[\s\S]*?<AUDIENCE>(.*?)<\/AUDIENCE>)?[\s\S]*?<\/MEMORY>",
                RegexOptions.IgnoreCase);
            foreach (System.Text.RegularExpressions.Match m in memRegex.Matches(outputText))
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
                    OwnerId   = agent.Id,
                    OwnerName = agent.Name,
                    Audience  = audience,
                    Category  = category,
                    Key       = key,
                    Value     = value,
                    Source    = "task",
                });
                await _logService.AddLogAsync($"[Memory Written] {agent.Name} stored memory during task: \"{key}\"", "info", agentName: agent.Name);
            }
        }
        catch (Exception ex)
        {
            await _logService.AddLogAsync($"TaskProcessorService Error: {ex.Message}", "warning");
        }
    }

    public async Task ProcessDiscussionAsync(string taskId)
    {
        try
        {
            await _logService.AddLogAsync($"ProcessDiscussionAsync started for task: {taskId}", "info");
            
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null || !task.Discussion.Any()) 
            {
                await _logService.AddLogAsync($"ProcessDiscussionAsync aborted: task null or empty discussion", "warning");
                return;
            }

            var agent = await _agentRepository.GetByIdAsync(task.AssignedAgentId);
            if (agent == null)
            {
                await _logService.AddLogAsync($"ProcessDiscussionAsync aborted: agent null", "warning");
                return;
            }

            var kernel = _kernelProviderService.CreateKernel(agent.ModelId, task.SubsidiaryId);

            var skAgent = new ChatCompletionAgent
            {
                Name = agent.Name.Replace(" ", "_"),
                Instructions = $"You are {agent.Name}, a {agent.Role}. {agent.Instructions}\nYou are discussing a task with the user. The task was '{task.Title}'. Provide helpful answers based on the task description and output.",
                Kernel = kernel,
                Arguments = new KernelArguments(new OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() 
                })
            };

            var skAgentFallback = new ChatCompletionAgent
            {
                Name = agent.Name.Replace(" ", "_"),
                Instructions = $"You are {agent.Name}, a {agent.Role}. {agent.Instructions}\nYou are discussing a task with the user. The task was '{task.Title}'. Provide helpful answers based on the task description and output.",
                Kernel = kernel,
                Arguments = new KernelArguments(new OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = FunctionChoiceBehavior.None() 
                })
            };

            var chatHistory = new ChatHistory();
            chatHistory.Add(new ChatMessageContent(AuthorRole.System, $"Task Description: {task.Description}\n\nTask Output: {task.Output}"));

            foreach (var msg in task.Discussion)
            {
                if (msg.Role.Equals("user", StringComparison.OrdinalIgnoreCase))
                {
                    chatHistory.Add(new ChatMessageContent(AuthorRole.User, msg.Content));
                }
                else
                {
                    chatHistory.Add(new ChatMessageContent(AuthorRole.Assistant, msg.Content));
                }
            }

            string outputText = string.Empty;

            try
            {
                await foreach (var message in skAgent.InvokeAsync(chatHistory))
                {
                    if (message.Message != null && message.Message.Content != null)
                    {
                        outputText += message.Message.Content;
                    }
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("400") || ex.Message.Contains("invalid_request_error"))
                {
                    try
                    {
                        var fallbackOutput = "";
                        await foreach (var message in skAgentFallback.InvokeAsync(chatHistory))
                        {
                            if (message.Message != null && message.Message.Content != null)
                            {
                                fallbackOutput += message.Message.Content;
                            }
                        }
                        outputText += fallbackOutput;
                    }
                    catch (Exception fallbackEx)
                    {
                        outputText += $"\nError during LLM execution (Fallback): {fallbackEx.Message}";
                    }
                }
                else
                {
                    outputText += $"\nError during LLM execution: {ex.Message}";
                }
            }

            // Reload the task to avoid overriding any concurrent changes
            task = await _taskRepository.GetByIdAsync(taskId);
            if (task != null)
            {
                task.Discussion.Add(new TaskDiscussionMessage
                {
                    Role = "assistant",
                    Content = outputText.Trim(),
                    SenderName = agent.Name,
                    Timestamp = DateTimeOffset.UtcNow.ToString("O")
                });
                await _taskRepository.SaveAsync(task);
                await _logService.AddLogAsync($"ProcessDiscussionAsync saved agent response for task {taskId}. Content length: {outputText.Length}", "info");
            }
            else
            {
                await _logService.AddLogAsync($"ProcessDiscussionAsync failed to reload task {taskId}", "warning");
            }
        }
        catch (Exception ex)
        {
            await _logService.AddLogAsync($"TaskProcessorService Error (ProcessDiscussionAsync): {ex.Message} \n {ex.StackTrace}", "warning");
        }
    }
}
