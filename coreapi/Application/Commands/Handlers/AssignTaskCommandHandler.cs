using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Commands.Handlers;

public class AssignTaskCommandHandler : ICommandHandler
{
    private readonly ITaskService _taskService;
    private readonly IAgentService _agentService;
    private readonly ISubsidiaryService _subsidiaryService;

    private static readonly Regex RegexPattern = new(
        @"assign\s+(?:task\s+)?([a-zA-Z0-9\s]+?)\s+to\s+([a-zA-Z\s]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public AssignTaskCommandHandler(
        ITaskService taskService,
        IAgentService agentService,
        ISubsidiaryService subsidiaryService)
    {
        _taskService = taskService;
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
            return new CommandResult(false, "Invalid assign task command structure.");
        }

        var rawTitle = match.Groups[1].Value.Trim();
        var agentQuery = match.Groups[2].Value.Trim();

        // Title-case the task title
        var textInfo = CultureInfo.CurrentCulture.TextInfo;
        var taskTitle = textInfo.ToTitleCase(rawTitle);

        // Find Agent
        var agents = await _agentService.GetAllAsync();
        var agent = agents.FirstOrDefault(a => a.Name.Equals(agentQuery, StringComparison.OrdinalIgnoreCase)) ??
                    agents.FirstOrDefault(a => a.Name.Contains(agentQuery, StringComparison.OrdinalIgnoreCase));

        if (agent == null)
        {
            return new CommandResult(false, $"I couldn't find an AI agent matching the name \"{agentQuery}\".");
        }

        if (!agent.Status.Equals("idle", StringComparison.OrdinalIgnoreCase))
        {
            return new CommandResult(false, $"{agent.Name} is currently busy working on another node stream.");
        }

        // Find Agent's Subsidiary
        var sub = await _subsidiaryService.GetByIdAsync(agent.SubsidiaryId);
        if (sub == null)
        {
            return new CommandResult(false, "System configuration error: Agent's subsidiary reference is missing.");
        }

        // Compute metrics
        var random = new Random();
        double taskCost = 0; // Cost defaults to 0 as per requirements
        var taskPayout = 4000 + random.Next(8000);

        if (sub.Balance < taskCost)
        {
            return new CommandResult(
                false,
                $"Insufficient funds in {sub.Name} (₹{sub.Balance:N0}) to deploy this task (Requires ₹{taskCost:N0})."
            );
        }

        var task = await _taskService.CreateTaskAsync(
            taskTitle,
            $"Task assigned by Director command: {taskTitle}.",
            sub.Id,
            agent.Id,
            taskPayout,
            taskCost
        );

        return new CommandResult(
            true,
            $"Task dispatch completed. Assigned \"{task.Title}\" to {agent.Role} {agent.Name}. Operational costs: ₹{task.Cost:N0}. Projected yields: ₹{task.Payout:N0}."
        );
    }
}
