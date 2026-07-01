using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using coreapi.Application.Services;
using CoreApi.Application.DTOs;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;

namespace CoreApi.Application.Services.Implementations;

public class TeamChatManagerService : ITeamChatManagerService
{
    private readonly IRepository<GroupChat> _groupChatRepository;
    private readonly IRepository<GroupChatMessage> _messageRepository;
    private readonly IRepository<CoreApi.Core.Entities.Agent> _agentRepository;
    private readonly coreapi.Infrastructure.AI.IKernelProviderService _kernelProviderService;

    public TeamChatManagerService(
        IRepository<GroupChat> groupChatRepository,
        IRepository<GroupChatMessage> messageRepository,
        IRepository<CoreApi.Core.Entities.Agent> agentRepository,
        coreapi.Infrastructure.AI.IKernelProviderService kernelProviderService)
    {
        _groupChatRepository = groupChatRepository;
        _messageRepository = messageRepository;
        _agentRepository = agentRepository;
        _kernelProviderService = kernelProviderService;
    }

    public async Task<GroupChat> CreateGroupChatAsync(string name, List<string> participantIds)
    {
        var chat = new GroupChat
        {
            Id = Guid.NewGuid().ToString(),
            Name = name,
            ParticipantIds = participantIds ?? new List<string>(),
            CreatedAt = DateTime.UtcNow.ToString("O")
        };
        await _groupChatRepository.SaveAsync(chat);
        return chat;
    }

    public async Task<IEnumerable<GroupChat>> GetAllChatsAsync()
    {
        return await _groupChatRepository.GetAllAsync();
    }

    public async Task<GroupChat?> GetChatByIdAsync(string id)
    {
        return await _groupChatRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<GroupChatMessage>> GetMessagesAsync(string chatId)
    {
        var messages = await _messageRepository.GetAllAsync();
        return messages.Where(m => m.GroupChatId == chatId).OrderBy(m => m.Timestamp).ToList();
    }

    public async Task DeleteGroupChatAsync(string id)
    {
        var chat = await _groupChatRepository.GetByIdAsync(id);
        if (chat != null)
        {
            await _groupChatRepository.DeleteAsync(id);
            var messages = await _messageRepository.GetAllAsync();
            foreach (var msg in messages.Where(m => m.GroupChatId == id))
            {
                await _messageRepository.DeleteAsync(msg.Id);
            }
        }
    }

    public async Task<GroupChatMessage> SendMessageAsync(string chatId, string senderId, string senderName, string senderType, string content)
    {
        var message = new GroupChatMessage
        {
            Id = Guid.NewGuid().ToString(),
            GroupChatId = chatId,
            SenderId = senderId,
            SenderName = senderName,
            SenderType = senderType,
            Content = content,
            Timestamp = DateTime.UtcNow.ToString("O")
        };
        await _messageRepository.SaveAsync(message);

        // Detect Mentions in the background
        _ = ProcessMentionsAsync(chatId, content);

        return message;
    }

    private async Task ProcessMentionsAsync(string chatId, string content)
    {
        var chat = await _groupChatRepository.GetByIdAsync(chatId);
        if (chat == null) return;

        var allAgents = (await _agentRepository.GetAllAsync()).ToList();
        
        // Mentions are in the format @Name or @Role
        var matches = Regex.Matches(content, @"@(\w+)");
        var mentionedNames = matches.Select(m => m.Groups[1].Value.ToLower()).ToHashSet();

        // Autonomous Routing or Fallback to last agent if no mentions
        if (mentionedNames.Count == 0)
        {
            var allMessages = await GetMessagesAsync(chatId);
            var lastAgentMessage = allMessages.LastOrDefault(m => m.SenderType == "agent");

            if (lastAgentMessage != null)
            {
                var lastAgent = allAgents.FirstOrDefault(a => a.Id == lastAgentMessage.SenderId);
                if (lastAgent != null)
                {
                    mentionedNames.Add(lastAgent.Name.ToLower().Replace(" ", ""));
                }
            }
            else
            {
                var agentListStr = string.Join(", ", allAgents.Select(a => $"{a.Name} ({a.Role})"));
                var prompt = $@"You are a routing agent for a group chat named '{chat.Name}'.
The user just sent the following message: ""{content}""
Which of these available agents is best suited to answer this? 
Available Agents: {agentListStr}

Return ONLY the exact name of the agent (e.g., 'Analyst'). If the message is trivial, a greeting, or doesn't require an agent's expertise, return 'NONE'. Do not add any extra text.";
                
                try
                {
                    var kernel = _kernelProviderService.CreateKernel("gemma4:latest");
                    var routerAgent = new ChatCompletionAgent
                    {
                        Name = "Router",
                        Instructions = "You are a precise router. You only return names or NONE.",
                        Kernel = kernel
                    };
                    var history = new ChatHistory();
                    history.AddUserMessage(prompt);

                    var routerResponse = "";
                    await foreach (var msg in routerAgent.InvokeAsync(history))
                    {
                        routerResponse += msg.Message.Content;
                    }

                    var selectedName = routerResponse.Trim().ToLower().Trim('\'', '"', '.');
                    if (selectedName != "none" && selectedName != "")
                    {
                        mentionedNames.Add(selectedName);
                    }
                }
                catch (Exception)
                {
                    // Fallback: ignore routing error
                }
            }
        }

        foreach (var agent in allAgents)
        {
            if (mentionedNames.Contains(agent.Name.ToLower().Replace(" ", "")) ||
                mentionedNames.Contains(agent.Role.ToLower().Replace(" ", "")))
            {
                // This agent was mentioned. 
                // Fetch recent chat history to give context
                var recentMessages = (await GetMessagesAsync(chatId)).TakeLast(10).ToList();
                
                var prompt = $"You were mentioned in a group chat named '{chat.Name}'.\n\nRecent messages:\n";
                foreach (var msg in recentMessages)
                {
                    prompt += $"[{msg.SenderName}]: {msg.Content}\n";
                }
                prompt += "\nRespond to the last message naturally as your persona. Keep it concise and helpful.";

                try 
                {
                    var kernel = _kernelProviderService.CreateKernel(agent.ModelId, agent.SubsidiaryId);
                    var skAgent = new ChatCompletionAgent
                    {
                        Name = agent.Name.Replace(" ", "_"),
                        Instructions = $"You are {agent.Name}, a {agent.Role}. Your Agent ID is '{agent.Id}'. {agent.Instructions}\nKeep your answer concise and helpful.",
                        Kernel = kernel,
                        Arguments = new KernelArguments(new Microsoft.SemanticKernel.Connectors.OpenAI.OpenAIPromptExecutionSettings 
                        { 
                            FunctionChoiceBehavior = Microsoft.SemanticKernel.FunctionChoiceBehavior.Auto() 
                        })
                    };

                    var history = new ChatHistory();
                    history.AddUserMessage(prompt);

                    var responseContent = "";
                    await foreach (var msg in skAgent.InvokeAsync(history))
                    {
                        responseContent += msg.Message.Content;
                    }

                    var botReply = new GroupChatMessage
                    {
                        Id = Guid.NewGuid().ToString(),
                        GroupChatId = chatId,
                        SenderId = agent.Id,
                        SenderName = agent.Name,
                        SenderType = "agent",
                        Content = responseContent,
                        Timestamp = DateTime.UtcNow.ToString("O")
                    };
                    await _messageRepository.SaveAsync(botReply);
                }
                catch (Exception)
                {
                    // Optionally log error
                }
            }
        }
    }
}
