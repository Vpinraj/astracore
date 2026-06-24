using Microsoft.SemanticKernel;
using System;

namespace coreapi.Infrastructure.AI.Providers;

public class GeminiProvider : IModelProvider
{
    public bool CanHandle(string modelId)
    {
        return modelId.StartsWith("gemini-", StringComparison.OrdinalIgnoreCase);
    }

    public void ConfigureKernel(IKernelBuilder builder, string modelId)
    {
        var geminiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? string.Empty;
        builder.AddGoogleAIGeminiChatCompletion(modelId: modelId, apiKey: geminiKey);
    }
}
