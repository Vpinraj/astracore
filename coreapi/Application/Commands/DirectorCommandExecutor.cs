using System.Collections.Generic;
using System.Threading.Tasks;

namespace CoreApi.Application.Commands;

public class DirectorCommandExecutor
{
    private readonly IEnumerable<ICommandHandler> _handlers;

    public DirectorCommandExecutor(IEnumerable<ICommandHandler> handlers)
    {
        _handlers = handlers;
    }

    public async Task<CommandResult> ExecuteAsync(string command)
    {
        if (string.IsNullOrWhiteSpace(command))
        {
            return new CommandResult(false, "Command cannot be empty.");
        }

        foreach (var handler in _handlers)
        {
            if (handler.CanHandle(command))
            {
                return await handler.HandleAsync(command);
            }
        }

        return new CommandResult(
            false,
            "I couldn't process that directive. You can issue commands such as: " +
            "'create subsidiary [Name] with [Amount]', " +
            "'hire Developer named [Name] for [Subsidiary]', " +
            "'allocate [Amount] to [Subsidiary]', or " +
            "'assign task [Task Title] to [Agent Name]'."
        );
    }
}
