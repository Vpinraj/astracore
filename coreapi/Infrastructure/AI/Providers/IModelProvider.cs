using Microsoft.SemanticKernel;

namespace coreapi.Infrastructure.AI.Providers;

public interface IModelProvider
{
    bool CanHandle(string modelId);
    void ConfigureKernel(IKernelBuilder builder, string modelId);
}
