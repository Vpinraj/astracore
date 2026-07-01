using System.ComponentModel;
using System.Threading.Tasks;
using System.Linq;
using CoreApi.Application.Services.Interfaces;
using Microsoft.SemanticKernel;

namespace coreapi.Infrastructure.AI.Plugins;

public class AstraCorePlugin
{
    private readonly ITaskService _taskService;
    private readonly ITransactionService _transactionService;
    private readonly IAgentService _agentService;
    private readonly ISubsidiaryService _subsidiaryService;
    private readonly ILeadService _leadService;
    private readonly string? _defaultSubsidiaryId;

    public AstraCorePlugin(
        ITaskService taskService,
        ITransactionService transactionService,
        IAgentService agentService,
        ISubsidiaryService subsidiaryService,
        ILeadService leadService,
        string? defaultSubsidiaryId = null)
    {
        _taskService = taskService;
        _transactionService = transactionService;
        _agentService = agentService;
        _subsidiaryService = subsidiaryService;
        _leadService = leadService;
        _defaultSubsidiaryId = defaultSubsidiaryId;
    }

    private async Task<string> ResolveSubsidiaryIdAsync(string subsidiaryNameOrId)
    {
        string subId = _defaultSubsidiaryId ?? "";

        if (!string.IsNullOrWhiteSpace(subsidiaryNameOrId))
        {
            var subs = await _subsidiaryService.GetAllAsync();
            var matched = subs.FirstOrDefault(s => s.Id == subsidiaryNameOrId || s.Name.Equals(subsidiaryNameOrId, System.StringComparison.OrdinalIgnoreCase));
            if (matched != null)
            {
                subId = matched.Id;
            }
        }

        return subId;
    }

    [KernelFunction("CreateTask")]
    [Description("Creates a new task in the system and assigns it to an agent if specified.")]
    public async Task<string> CreateTaskAsync(
        [Description("The title of the task")] string title,
        [Description("A detailed description of the task requirements")] string description,
        [Description("Optional. The name or ID of the subsidiary the task belongs to. If omitted, uses your current subsidiary.")] string subsidiaryNameOrId = "",
        [Description("The ID of the agent to assign the task to (optional)")] string assignedAgentId = "")
    {
        string subId = await ResolveSubsidiaryIdAsync(subsidiaryNameOrId);
        if (string.IsNullOrWhiteSpace(subId)) return "Failed to create task: Could not determine subsidiary.";

        var task = await _taskService.CreateTaskAsync(title, description, subId, assignedAgentId);
        return $"Task '{title}' created successfully with ID {task.Id}";
    }

    [KernelFunction("GetTasks")]
    [Description("Gets a list of all tasks in the system. Use this to find the ID of a task before fetching its details.")]
    public async Task<string> GetTasksAsync(
        [Description("Optional. Filter by assigned agent ID.")] string assignedAgentId = "",
        [Description("Optional. Filter by task status (e.g., 'pending', 'in_progress', 'completed').")] string status = "")
    {
        var tasks = await _taskService.GetAllAsync();
        
        if (!string.IsNullOrWhiteSpace(assignedAgentId))
        {
            tasks = tasks.Where(t => t.AssignedAgentId == assignedAgentId).ToList();
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            tasks = tasks.Where(t => t.Status.Equals(status, System.StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!tasks.Any()) return "No tasks found matching the criteria.";

        var summary = tasks.Select(t => $"- ID: {t.Id} | Title: {t.Title} | Status: {t.Status} | Progress: {t.Progress}% | Agent: {t.AssignedAgentId ?? "Unassigned"}");
        return "Tasks:\n" + string.Join("\n", summary);
    }

    [KernelFunction("GetTaskDetails")]
    [Description("Fetches the full details of a specific task, including its title, description, status, progress, and execution logs/output.")]
    public async Task<string> GetTaskDetailsAsync(
        [Description("The exact ID of the task to fetch (e.g., 'task-123')")] string taskId)
    {
        var tasks = await _taskService.GetAllAsync();
        var task = tasks.FirstOrDefault(t => t.Id.Equals(taskId, System.StringComparison.OrdinalIgnoreCase));
        if (task == null) return $"Task with ID '{taskId}' not found.";

        var outputData = string.IsNullOrWhiteSpace(task.Output) ? string.Join("\n", task.Logs) : task.Output;
        return $"Task ID: {task.Id}\nTitle: {task.Title}\nDescription: {task.Description}\nStatus: {task.Status}\nProgress: {task.Progress}%\nAssigned Agent ID: {task.AssignedAgentId ?? "Unassigned"}\n\n--- Output/Logs ---\n{outputData}";
    }

    [KernelFunction("CreateTransaction")]
    [Description("Records a financial transaction (Expense, Sale, Procurement) for a subsidiary.")]
    public async Task<string> CreateTransactionAsync(
        [Description("The type of transaction (e.g., 'Expense', 'Sale', 'Procurement')")] string type,
        [Description("The total amount of the transaction in INR")] double totalAmount,
        [Description("A brief description of the transaction")] string description,
        [Description("The name of the partner or vendor involved")] string partnerName,
        [Description("Optional. The name or ID of the subsidiary. If omitted, uses your current subsidiary.")] string subsidiaryNameOrId = "",
        [Description("The ID of the agent processing this transaction (optional)")] string processedByAgentId = "")
    {
        string subId = await ResolveSubsidiaryIdAsync(subsidiaryNameOrId);
        if (string.IsNullOrWhiteSpace(subId)) return "Failed to create transaction: Could not determine subsidiary.";

        // Simplifying the tax calculation for the tool
        double subtotal = System.Math.Round(totalAmount / 1.18, 2);
        double tax = System.Math.Round(subtotal * 0.09, 2);
        double diff = totalAmount - (subtotal + tax + tax);
        subtotal += diff;
        string referenceNumber = $"REF-{System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1000000:D6}";

        await _transactionService.RecordTransactionAsync(
            subsidiaryId: subId,
            type: type,
            subtotal: subtotal,
            discount: 0,
            cgst: tax,
            sgst: tax,
            totalAmount: totalAmount,
            amountPaidOrReceived: totalAmount,
            description: description,
            referenceNumber: referenceNumber,
            partnerName: partnerName,
            documentUrl: "",
            processedByAgentId: processedByAgentId,
            status: "Completed"
        );
        return $"Transaction of type '{type}' for {totalAmount} INR recorded successfully with reference {referenceNumber}.";
    }

    [KernelFunction("CreateLead")]
    [Description("Creates a new sales or recruitment lead for a subsidiary.")]
    public async Task<string> CreateLeadAsync(
        [Description("The name of the contact person")] string contactName,
        [Description("The name of the company or organization")] string companyName,
        [Description("Email address of the lead (optional)")] string email = "",
        [Description("Phone number of the lead (optional)")] string phone = "",
        [Description("The stage of the lead (e.g., 'New', 'Contacted', 'Qualified')")] string stage = "New",
        [Description("Estimated value in INR (optional)")] double estimatedValue = 0,
        [Description("Optional. The name or ID of the subsidiary. If omitted, uses your current subsidiary.")] string subsidiaryNameOrId = "")
    {
        string subId = await ResolveSubsidiaryIdAsync(subsidiaryNameOrId);
        if (string.IsNullOrWhiteSpace(subId)) return "Failed to create lead: Could not determine subsidiary.";

        var lead = await _leadService.CreateLeadAsync(
            subsidiaryId: subId,
            contactName: contactName,
            companyName: companyName,
            email: email,
            phone: phone,
            source: "AI Agent",
            stage: stage,
            estimatedValue: estimatedValue
        );
        return $"Lead '{contactName}' at '{companyName}' created successfully with ID {lead.Id}";
    }

    [KernelFunction("HireAgent")]
    [Description("Hires a new AI agent and assigns them to a subsidiary.")]
    public async Task<string> HireAgentAsync(
        [Description("The name of the new agent")] string name,
        [Description("The role of the new agent (e.g., Developer, Marketer)")] string role,
        [Description("The specific system prompt/instructions for the agent")] string instructions,
        [Description("The AI model ID to use (default: gemma4:latest)")] string modelId = "gemma4:latest",
        [Description("Optional. The name or ID of the subsidiary to assign the agent to. If omitted, uses your current subsidiary.")] string subsidiaryNameOrId = "")
    {
        string subId = await ResolveSubsidiaryIdAsync(subsidiaryNameOrId);
        if (string.IsNullOrWhiteSpace(subId)) return "Failed to hire agent: Could not determine subsidiary.";

        var agent = await _agentService.HireAgentAsync(name, role, subId, instructions, modelId);
        return $"Agent '{name}' hired successfully as {role} with ID {agent.Id} in subsidiary {subId}";
    }

    [KernelFunction("AskQuestionToUser")]
    [Description("Pauses your execution and asks the user a clarifying question. You will resume when they answer.")]
    public string AskQuestionToUser([Description("The question to ask the user")] string question)
    {
        // To be intercepted by TaskProcessorService
        return $"[BLOCKING_QUESTION]: {question}";
    }
}
