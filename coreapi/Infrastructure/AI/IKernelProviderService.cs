using Microsoft.SemanticKernel;

namespace coreapi.Infrastructure.AI;

public interface IKernelProviderService
{
    Kernel CreateKernel(string modelId, string? defaultSubsidiaryId = null);
}
