using System;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Commands.Handlers;

public class CreateSubsidiaryCommandHandler : ICommandHandler
{
    private readonly ISubsidiaryService _subsidiaryService;
    private static readonly Regex RegexPattern = new(
        @"create\s+subsidiary\s+([a-zA-Z0-9\s]+?)\s+with\s+(?:₹|\$)?(\d+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    // Default sector list to rotate through
    private static readonly string[] INDUSTRIES = { "AI Software", "Robotics", "Fintech", "Creative Agency", "Biotech", "Cybersecurity" };

    public CreateSubsidiaryCommandHandler(ISubsidiaryService subsidiaryService)
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
            return new CommandResult(false, "Invalid create subsidiary command structure.");
        }

        var rawName = match.Groups[1].Value.Trim();
        var rawFunds = match.Groups[2].Value;

        if (!double.TryParse(rawFunds, out var funds) || funds <= 0)
        {
            return new CommandResult(false, "I couldn't understand the investment amount. Please specify a positive number.");
        }

        // Title-case the name
        var textInfo = CultureInfo.CurrentCulture.TextInfo;
        var formattedName = textInfo.ToTitleCase(rawName);

        var random = new Random();
        var industry = INDUSTRIES[random.Next(INDUSTRIES.Length)];

        var sub = await _subsidiaryService.CreateSubsidiaryAsync(formattedName, industry, funds);

        return new CommandResult(
            true,
            $"Understood. I have initialized a new subsidiary named \"{sub.Name}\" in the {sub.Industry} sector with ₹{funds:N0} in seed capital."
        );
    }
}
