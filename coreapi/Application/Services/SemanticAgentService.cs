using System.Threading.Tasks;
using System.Threading;
using coreapi.Core.Entities;
using coreapi.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;

namespace coreapi.Application.Services;

public class SemanticAgentService
{
    private readonly IKernelProviderService _kernelProviderService;

    public SemanticAgentService(IKernelProviderService kernelProviderService)
    {
        _kernelProviderService = kernelProviderService;
    }

    public async Task<ChatResponse> ExecuteAgentTaskAsync(ChatRequest request, CancellationToken cancellationToken = default)
    {
        // Create the Kernel
        var kernel = _kernelProviderService.CreateKernel(request.AssignedModelId, request.SubsidiaryId);

        // Define the Agent
        var agent = new ChatCompletionAgent
        {
            Name = "SystemAgent",
            Instructions = "You are a helpful AI assistant. Answer queries effectively.",
            Kernel = kernel,
            Arguments = new KernelArguments(new Microsoft.SemanticKernel.Connectors.OpenAI.OpenAIPromptExecutionSettings 
            { 
                FunctionChoiceBehavior = Microsoft.SemanticKernel.FunctionChoiceBehavior.Auto() 
            })
        };

        var history = new ChatHistory();
        history.AddUserMessage(request.Prompt);

        var responseContent = string.Empty;

        // Run the agent
        await foreach (var message in agent.InvokeAsync(history, cancellationToken: cancellationToken))
        {
            // AgentResponseItem<ChatMessageContent>
            responseContent += message.Message.Content;
            history.Add(message.Message);
        }

        return new ChatResponse
        {
            Content = responseContent,
            ModelUsed = request.AssignedModelId,
            PromptTokens = 0, // Requires manual logging interceptor in SK
            CompletionTokens = 0
        };
    }
}
