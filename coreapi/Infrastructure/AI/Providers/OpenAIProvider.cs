using Microsoft.SemanticKernel;
using System;

namespace coreapi.Infrastructure.AI.Providers;

public class OpenAIProvider : IModelProvider
{
    public bool CanHandle(string modelId)
    {
        return modelId.StartsWith("gpt-", StringComparison.OrdinalIgnoreCase) || modelId.StartsWith("o1-", StringComparison.OrdinalIgnoreCase);
    }

    public void ConfigureKernel(IKernelBuilder builder, string modelId)
    {
        var openAiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
        builder.AddOpenAIChatCompletion(modelId: modelId, apiKey: openAiKey);
    }
}
