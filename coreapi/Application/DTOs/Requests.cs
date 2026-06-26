using CoreApi.Core.Entities;

namespace CoreApi.Application.DTOs;

public record CreateSubsidiaryRequest(
    string Name,
    string Industry,
    double Investment,
    string? ColorTheme = null,
    string? LogoUrl = null,
    string? Website = null,
    string? Email = null,
    string? Phone = null,
    string? Description = null,
    string? Address = null,
    string? BankDetails = null
);

public record HireAgentRequest(
    string Name,
    string Role,
    string SubsidiaryId,
    string? Instructions = null,
    string? ModelId = null,
    AgentRoleDefinition? CustomOverrides = null
);

public record CreateTaskRequest(
    string Title,
    string Description,
    string SubsidiaryId,
    string AssignedAgentId,
    string? AttachedFileName = null,
    string? AttachedFileData = null
);

public record AllocateFundsRequest(
    string SubsidiaryId,
    double Amount
);

public record StartTaskRequest(
    string TaskId
);

public record DirectorCommandRequest(
    string Command
);

public record AssignAgentRequest(
    string TaskId,
    string AgentId
);

public record CreateTransactionRequest(
    string SubsidiaryId,
    string Type, // Investment | Expense | Profit | Procurement | Sale
    double Subtotal,
    double Discount,
    double Cgst,
    double Sgst,
    double TotalAmount,
    double AmountPaidOrReceived,
    string Description,
    string ReferenceNumber = "",
    string PartnerName = "",
    string DocumentUrl = "",
    string ProcessedByAgentId = "",
    string Status = "Completed"
);

public record CreateLeadRequest(
    string SubsidiaryId,
    string ContactName,
    string CompanyName,
    string Email = "",
    string Phone = "",
    string Source = "Inbound",
    string Stage = "New",
    double EstimatedValue = 0,
    string AssignedToId = "",
    string AssignedToName = "",
    string Notes = ""
);

public record UpdateLeadStageRequest(
    string LeadId,
    string Stage,
    string FollowUpNote = "",
    string CreatedBy = "System"
);

public record CreateEmployeeRequest(
    string Name,
    string Designation,
    string Department,
    string SubsidiaryId,
    string Email = "",
    string Phone = "",
    double Salary = 0,
    string JoinDate = "",
    string ReportsToId = "",
    string ReportsToName = "",
    string Avatar = "👤",
    string Status = "Active"
);

// ── Heartbeat ──────────────────────────────────────────────────────────────────

/// <summary>Request body for setting an agent's autonomous heartbeat configuration.</summary>
public record SetHeartbeatRequest(
    bool Enabled,
    int IntervalMinutes,
    string Instruction
);

// ── Agent Update ───────────────────────────────────────────────────────────────

/// <summary>
/// PATCH request body for updating mutable agent fields.
/// All fields are nullable/optional — only non-null values are applied.
/// </summary>
public class UpdateAgentRequest
{
    public string? Name { get; set; }
    public string? Instructions { get; set; }
    public string? ModelId { get; set; }
    public string? Avatar { get; set; }
    public int? Level { get; set; }
    public double? Efficiency { get; set; }

    // LLM / Role config
    public double? Temperature { get; set; }
    public int? MaxTokens { get; set; }
    public string? OutputFormat { get; set; }
    public string? MemoryType { get; set; }
    public List<AgentTool>? Tools { get; set; }

    // Heartbeat fields
    public bool? HeartbeatEnabled { get; set; }
    public int? HeartbeatIntervalMinutes { get; set; }
    public string? HeartbeatInstruction { get; set; }
}
