using System;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Commands.Handlers;

public class StatusCommandHandler : ICommandHandler
{
    private readonly ISubsidiaryService _subsidiaryService;
    private readonly IAgentService _agentService;
    private readonly ITaskService _taskService;

    public StatusCommandHandler(
        ISubsidiaryService subsidiaryService,
        IAgentService agentService,
        ITaskService taskService)
    {
        _subsidiaryService = subsidiaryService;
        _agentService = agentService;
        _taskService = taskService;
    }

    public bool CanHandle(string command)
    {
        var clean = command.ToLowerInvariant();
        return clean.Contains("status of") || 
               clean.Contains("how is") ||
               clean.Contains("status") || 
               clean.Contains("summary") || 
               clean.Contains("overall") || 
               clean.Contains("hello") || 
               clean.Contains("hi ");
    }

    public async Task<CommandResult> HandleAsync(string command)
    {
        var clean = command.ToLowerInvariant().Trim();

        // 1. Single subsidiary status
        if (clean.Contains("status of") || clean.Contains("how is"))
        {
            var subQuery = clean
                .Replace("status of", "")
                .Replace("how is", "")
                .Replace("doing", "")
                .Replace("performing", "")
                .Replace("?", "")
                .Trim();

            var subsidiaries = await _subsidiaryService.GetAllAsync();
            var sub = subsidiaries.FirstOrDefault(s => s.Name.Equals(subQuery, StringComparison.OrdinalIgnoreCase)) ??
                      subsidiaries.FirstOrDefault(s => s.Name.Contains(subQuery, StringComparison.OrdinalIgnoreCase));

            if (sub != null)
            {
                var agents = await _agentService.GetAllAsync();
                var tasks = await _taskService.GetAllAsync();

                var subAgentsCount = agents.Count(a => a.SubsidiaryId == sub.Id);
                var activeTasksCount = tasks.Count(t => t.SubsidiaryId == sub.Id && t.Status.Equals("in_progress", StringComparison.OrdinalIgnoreCase));

                return new CommandResult(
                    true,
                    $"{sub.Name} metrics: Seed Investment is ₹{sub.Investment:N0}, Operating Balance is ₹{sub.Balance:N0}, with total profits of ₹{sub.Profits:N0} and expenses of ₹{sub.Expenses:N0}. There are currently {subAgentsCount} agents deployed, with {activeTasksCount} tasks running."
                );
            }
        }

        // 2. Overall Status / Greeting
        if (clean.Contains("status") || clean.Contains("summary") || clean.Contains("overall") || clean.Contains("hello") || clean.Contains("hi "))
        {
            var subs = (await _subsidiaryService.GetAllAsync()).ToList();
            var agents = (await _agentService.GetAllAsync()).ToList();

            var totalInvestments = subs.Sum(s => s.Investment);
            var totalExpenses = subs.Sum(s => s.Expenses);
            var totalProfits = subs.Sum(s => s.Profits);
            var activeCount = agents.Count(a => a.Status.Equals("working", StringComparison.OrdinalIgnoreCase));

            return new CommandResult(
                true,
                $"Hello Director. The parent enterprise is operating stably. Total network investments: ₹{totalInvestments:N0}. Total operating expenses: ₹{totalExpenses:N0}. Accumulated agent profits: ₹{totalProfits:N0}. There are {activeCount} AI agents actively running workflows across {subs.Count} subsidiaries. Let me know if you would like me to hire agents, allocate capital, or dispatch tasks."
            );
        }

        return new CommandResult(false, "Unknown status query query.");
    }
}
