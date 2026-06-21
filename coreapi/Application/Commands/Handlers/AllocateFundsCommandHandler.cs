using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Commands.Handlers;

public class AllocateFundsCommandHandler : ICommandHandler
{
    private readonly ISubsidiaryService _subsidiaryService;
    private static readonly Regex RegexPattern = new(
        @"(?:allocate|give|invest)\s+(?:₹|\$)?(\d+)\s+to\s+([a-zA-Z0-9\s]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public AllocateFundsCommandHandler(ISubsidiaryService subsidiaryService)
    {
        _subsidiaryService = subsidiaryService;
    }

    public bool CanHandle(string command)
    {
        return RegexPattern.IsMatch(command);
    }

    public async Task<CommandResult> HandleAsync(string command)
    {
        var match = RegexPattern.Match(command);
        if (!match.Success)
        {
            return new CommandResult(false, "Invalid allocate funds command structure.");
        }

        var rawAmount = match.Groups[1].Value;
        var subQuery = match.Groups[2].Value.Trim();

        if (!double.TryParse(rawAmount, out var amount) || amount <= 0)
        {
            return new CommandResult(false, "Please specify a positive funding amount.");
        }

        // Find Subsidiary
        var subsidiaries = await _subsidiaryService.GetAllAsync();
        var sub = subsidiaries.FirstOrDefault(s => s.Name.Equals(subQuery, StringComparison.OrdinalIgnoreCase)) ??
                  subsidiaries.FirstOrDefault(s => s.Name.Contains(subQuery, StringComparison.OrdinalIgnoreCase));

        if (sub == null)
        {
            return new CommandResult(false, $"I couldn't find a subsidiary named \"{subQuery}\" to credit.");
        }

        await _subsidiaryService.AllocateFundsAsync(sub.Id, amount);

        return new CommandResult(
            true,
            $"Funds transferred. Deposited ₹{amount:N0} of parent company investment capital to {sub.Name}."
        );
    }
}
