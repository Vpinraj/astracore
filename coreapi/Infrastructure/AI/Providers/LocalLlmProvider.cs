using Microsoft.SemanticKernel;
using System;

namespace coreapi.Infrastructure.AI.Providers;

public class LocalLlmProvider : IModelProvider
{
    public bool CanHandle(string modelId)
    {
        // Handle common local LLM prefixes or catch-all if not matched by others
        return modelId.StartsWith("llama", StringComparison.OrdinalIgnoreCase) || 
               modelId.StartsWith("gemma", StringComparison.OrdinalIgnoreCase) ||
               modelId.StartsWith("mistral", StringComparison.OrdinalIgnoreCase) ||
               modelId.StartsWith("qwen", StringComparison.OrdinalIgnoreCase);
    }

    public void ConfigureKernel(IKernelBuilder builder, string modelId)
    {
        var localEndpoint = Environment.GetEnvironmentVariable("LOCAL_LLM_URL") ?? "http://localhost:11434/v1";
        builder.AddOpenAIChatCompletion(modelId: modelId, apiKey: "ollama", endpoint: new Uri(localEndpoint));
    }
}
