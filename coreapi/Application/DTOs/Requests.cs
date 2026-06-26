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
