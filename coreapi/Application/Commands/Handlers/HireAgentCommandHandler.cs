using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Commands.Handlers;

public class HireAgentCommandHandler : ICommandHandler
{
    private readonly IAgentService _agentService;
    private readonly ISubsidiaryService _subsidiaryService;

    private static readonly Regex RegexPattern = new(
        @"(?:hire|create\s+agent)\s+([a-zA-Z\s]+?)\s+named\s+([a-zA-Z\s]+?)\s+for\s+([a-zA-Z0-9\s]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly string[] VALID_ROLES =
    {
        "CEO", "CFO", "CTO", "CMO", "Product Manager", "Developer", "UI Designer", "Marketer", "QA Engineer", "Customer Support"
    };

    public HireAgentCommandHandler(IAgentService agentService, ISubsidiaryService subsidiaryService)
    {
        _agentService = agentService;
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
            return new CommandResult(false, "Invalid hire agent command structure.");
        }

        var rawRole = match.Groups[1].Value.Trim();
        var rawName = match.Groups[2].Value.Trim();
        var subQuery = match.Groups[3].Value.Trim();

        // Match Role
        var matchedRole = VALID_ROLES.FirstOrDefault(r => r.Equals(rawRole, StringComparison.OrdinalIgnoreCase)) ??
                          VALID_ROLES.FirstOrDefault(r => r.Contains(rawRole, StringComparison.OrdinalIgnoreCase));

        if (matchedRole == null)
        {
            return new CommandResult(
                false,
                $"I couldn't identify the role \"{rawRole}\". Available roles include CEO, CFO, CTO, Developer, UI Designer, Marketer, or Customer Support."
            );
        }

        // Find Subsidiary
        var subsidiaries = await _subsidiaryService.GetAllAsync();
        var sub = subsidiaries.FirstOrDefault(s => s.Name.Equals(subQuery, StringComparison.OrdinalIgnoreCase)) ??
                  subsidiaries.FirstOrDefault(s => s.Name.Contains(subQuery, StringComparison.OrdinalIgnoreCase));

        if (sub == null)
        {
            return new CommandResult(false, $"I couldn't find a subsidiary matching \"{subQuery}\". Please double check your subsidiary names.");
        }

        double deductionFee = 0; // Default hiring fee is 0
        if (sub.Balance < deductionFee)
        {
            return new CommandResult(false, $"Insufficient funds in {sub.Name} (Balance: ₹{sub.Balance:N0}). Server hiring fee is ₹{deductionFee:N0}.");
        }

        // Format Name
        var textInfo = CultureInfo.CurrentCulture.TextInfo;
        var formattedName = textInfo.ToTitleCase(rawName);

        var agent = await _agentService.HireAgentAsync(formattedName, matchedRole, sub.Id, deductionFee: deductionFee);

        return new CommandResult(
            true,
            $"Confirmed. I have deployed {agent.Role} {agent.Name} to the \"{sub.Name}\" network node."
        );
    }
}
