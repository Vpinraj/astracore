using System.Threading.Tasks;

namespace CoreApi.Application.Commands;

public interface ICommandHandler
{
    bool CanHandle(string command);
    Task<CommandResult> HandleAsync(string command);
}
