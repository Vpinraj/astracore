using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace coreapi.Infrastructure.AI.Plugins;

public class TimePlugin
{
    [KernelFunction, Description("Gets the current system time in UTC.")]
    public string GetCurrentUtcTime()
    {
        return DateTime.UtcNow.ToString("O");
    }
}
