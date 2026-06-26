using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using coreapi.Core.Entities;
using CoreApi.Core.Entities;
using CoreApi.Application.Services.Interfaces;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.Agents.Chat;
using Microsoft.SemanticKernel.ChatCompletion;
using coreapi.Infrastructure.AI;
using CoreApi.Presentation.Controllers;

namespace coreapi.Application.Services;

public class GroupChatService
{
    private readonly IAgentService _agentService;
    private readonly IKernelProviderService _kernelProviderService;

    public GroupChatService(IAgentService agentService, IKernelProviderService kernelProviderService)
    {
        _agentService = agentService;
        _kernelProviderService = kernelProviderService;
    }

    public async Task<List<ResultMessageDto>> RunHierarchicalChatAsync(string primaryAgentId, string message, List<ChatMessageDto> history, List<AttachmentDto>? attachments = null, CancellationToken cancellationToken = default)
    {
        var primaryAgent = await _agentService.GetByIdAsync(primaryAgentId);
        if (primaryAgent == null) return new List<ResultMessageDto>();

        // Find subordinate/peer agents in the same subsidiary (excluding the primary agent itself)
        var allAgents = await _agentService.GetAllAsync();
        var subsidiaryAgents = allAgents.Where(a => a.SubsidiaryId == primaryAgent.SubsidiaryId && a.Id != primaryAgent.Id).ToList();

        // 1. Create Semantic Kernel Agents
        var skAgents = new List<ChatCompletionAgent>();

        // Create the primary agent
        var mainSkAgent = new ChatCompletionAgent
        {
            Name = primaryAgent.Name.Replace(" ", "_"), // SK Agent names cannot contain spaces
            Instructions = $"You are {primaryAgent.Name}, a {primaryAgent.Role}. {primaryAgent.Instructions}\nYou are talking directly to the user. If the user asks for details outside your domain, you can ask the other agents in this chat for information before responding to the user. Always wait for them to provide the info if you ask.",
            Kernel = _kernelProviderService.CreateKernel(primaryAgent.ModelId, primaryAgent.SubsidiaryId),
            Arguments = new KernelArguments(new Microsoft.SemanticKernel.Connectors.OpenAI.OpenAIPromptExecutionSettings 
            { 
                FunctionChoiceBehavior = Microsoft.SemanticKernel.FunctionChoiceBehavior.Auto() 
            })
        };
        skAgents.Add(mainSkAgent);

        // Create secondary agents
        foreach (var subAgent in subsidiaryAgents)
        {
            skAgents.Add(new ChatCompletionAgent
            {
                Name = subAgent.Name.Replace(" ", "_"),
                Instructions = $"You are {subAgent.Name}, a {subAgent.Role}. {subAgent.Instructions}\nYou are assisting {primaryAgent.Name}. Only respond if {primaryAgent.Name} explicitly asks you a question.",
                Kernel = _kernelProviderService.CreateKernel(subAgent.ModelId, subAgent.SubsidiaryId),
                Arguments = new KernelArguments(new Microsoft.SemanticKernel.Connectors.OpenAI.OpenAIPromptExecutionSettings 
                { 
                    FunctionChoiceBehavior = Microsoft.SemanticKernel.FunctionChoiceBehavior.Auto() 
                })
            });
        }

        // 3. Setup the Group Chat
        #pragma warning disable SKEXP0110
        var chat = new AgentGroupChat(skAgents.ToArray())
        {
            ExecutionSettings = new()
            {
                SelectionStrategy = new SequentialSelectionStrategy
                {
                    InitialAgent = mainSkAgent
                },
                TerminationStrategy = new DefaultTerminationStrategy(mainSkAgent.Name, skAgents.Count)
            }
        };

        // 4. Load History
        foreach (var hist in history)
        {
            var role = hist.Role.ToLower() == "user" ? AuthorRole.User : AuthorRole.Assistant;
            chat.AddChatMessage(new ChatMessageContent(role, hist.Content));
        }

        // 5. Add new message
        var msgContentItems = new ChatMessageContentItemCollection();
        if (!string.IsNullOrWhiteSpace(message))
        {
            msgContentItems.Add(new TextContent(message));
        }
        
        if (attachments != null)
        {
            foreach (var att in attachments)
            {
                if (att.Data.StartsWith("data:image/"))
                {
                    var commaIndex = att.Data.IndexOf(',');
                    var mimeType = att.Data.Substring(5, att.Data.IndexOf(';') - 5);
                    var base64Data = att.Data.Substring(commaIndex + 1);
                    var imageBytes = Convert.FromBase64String(base64Data);
                    msgContentItems.Add(new ImageContent(new ReadOnlyMemory<byte>(imageBytes), mimeType));
                }
                else
                {
                    // Fallback to text representation or stripping data URI header
                    var base64Data = att.Data.Contains(",") ? att.Data.Substring(att.Data.IndexOf(",") + 1) : att.Data;
                    try
                    {
                        var textData = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64Data));
                        msgContentItems.Add(new TextContent($"\n--- Attachment: {att.Name} ---\n{textData}\n--- End Attachment ---"));
                    }
                    catch
                    {
                        msgContentItems.Add(new TextContent($"\n[Attachment {att.Name} provided but could not be parsed as text]"));
                    }
                }
            }
        }
        
        chat.AddChatMessage(new ChatMessageContent(AuthorRole.User, msgContentItems));

        var outputLogs = new List<ResultMessageDto>();

        try
        {
            // 6. Run the chat
            await foreach (var chatMsg in chat.InvokeAsync(cancellationToken: cancellationToken))
            {
                var content = chatMsg.Content ?? "";
                var agentName = chatMsg.AuthorName ?? "Assistant";
                
                outputLogs.Add(new ResultMessageDto
                {
                    Role = "assistant",
                    Content = content,
                    Author = agentName.Replace("_", " ")
                });
            }
        }
        catch (System.Exception ex)
        {
            outputLogs.Add(new ResultMessageDto
            {
                Role = "assistant",
                Content = $"[SYSTEM ERROR] An AI agent failed to respond: {ex.Message}",
                Author = "System"
            });
        }

        return outputLogs;
    }
}

// Dummy termination strategy for basic limit
#pragma warning disable SKEXP0110
public class DefaultTerminationStrategy : TerminationStrategy
{
    private readonly string _primaryAgentName;
    private readonly int _agentCount;
    private int _turnCount = 0;

    public DefaultTerminationStrategy(string primaryAgentName, int agentCount)
    {
        _primaryAgentName = primaryAgentName;
        _agentCount = agentCount;
    }

    protected override Task<bool> ShouldAgentTerminateAsync(Microsoft.SemanticKernel.Agents.Agent agent, IReadOnlyList<ChatMessageContent> history, CancellationToken cancellationToken)
    {
        // To prevent Gemini API '400 Bad Request' errors caused by consecutive model messages or forced sub-agent sequential loops,
        // we terminate the chat group evaluation after the primary agent has successfully responded to the user.
        return Task.FromResult(true);
    }
}
