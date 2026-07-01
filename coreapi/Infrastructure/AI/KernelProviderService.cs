using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.SemanticKernel;
using coreapi.Infrastructure.AI.Providers;
using Microsoft.Extensions.DependencyInjection;
using coreapi.Infrastructure.AI.Plugins;
using CoreApi.Application.Services.Interfaces;

namespace coreapi.Infrastructure.AI;

public class KernelProviderService : IKernelProviderService
{
    private readonly IEnumerable<IModelProvider> _providers;
    private readonly IServiceProvider _serviceProvider;

    public KernelProviderService(IEnumerable<IModelProvider> providers, IServiceProvider serviceProvider)
    {
        _providers = providers;
        _serviceProvider = serviceProvider;
    }

    public Kernel CreateKernel(string modelId, string? defaultSubsidiaryId = null)
    {
        var builder = Kernel.CreateBuilder();

        var provider = _providers.FirstOrDefault(p => p.CanHandle(modelId));
        
        if (provider != null)
        {
            provider.ConfigureKernel(builder, modelId);
        }
        else
        {
            // Fallback for unknown models (assume local/Ollama format by default)
            var localEndpoint = Environment.GetEnvironmentVariable("LOCAL_LLM_URL") ?? "http://localhost:11434/v1";
            builder.AddOpenAIChatCompletion(modelId: modelId, apiKey: "ollama", endpoint: new Uri(localEndpoint));
        }

        // Register AstraCore System Operations Plugin
        var astraPlugin = new AstraCorePlugin(
            _serviceProvider.GetRequiredService<ITaskService>(),
            _serviceProvider.GetRequiredService<ITransactionService>(),
            _serviceProvider.GetRequiredService<IAgentService>(),
            _serviceProvider.GetRequiredService<ISubsidiaryService>(),
            _serviceProvider.GetRequiredService<ILeadService>(),
            defaultSubsidiaryId
        );
        builder.Plugins.AddFromObject(astraPlugin, "AstraCore");

        // Register WebSearch Plugin
        var webSearchPlugin = new WebSearchPlugin();
        builder.Plugins.AddFromObject(webSearchPlugin, "WebSearch");

        return builder.Build();
    }
}
