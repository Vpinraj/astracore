using System.Collections.Generic;

namespace CoreApi.Core.Entities;

public class AppConfig : IEntity
{
    public string Id { get; set; } = "app-config";
    public string Theme { get; set; } = "dark";
    public int TickSpeedMs { get; set; } = 3500;
    public string SystemName { get; set; } = "AstraCore";
}

public class Subsidiary : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public double Investment { get; set; }
    public double Balance { get; set; }
    public double Expenses { get; set; }
    public double Profits { get; set; }
    public string Color { get; set; } = string.Empty;
    public string BorderColor { get; set; } = string.Empty;
    public string TextColor { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BankDetails { get; set; } = string.Empty;
    public int Procurements { get; set; }
    public int Sales { get; set; }
}

public class AgentTool
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

public class AgentRoleDefinition
{
    public string Name { get; set; } = string.Empty;
    public List<string> CommonSkills { get; set; } = new();
    public double Temperature { get; set; } = 0.5;
    public int MaxTokens { get; set; } = 2048;
    public string OutputFormat { get; set; } = "markdown";
    public string MemoryType { get; set; } = "short_term";
    public List<AgentTool> Tools { get; set; } = new();
}

public class ConversationMessage
{
    public string Role { get; set; } = "user";
    public string Content { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

public class Agent : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public AgentRoleDefinition? RoleDefinition { get; set; }
    public string Instructions { get; set; } = string.Empty;
    public string ModelId { get; set; } = "gemini-2.0-flash";
    public string SubsidiaryId { get; set; } = string.Empty;
    public string Status { get; set; } = "idle"; // idle | thinking | working | resting
    public string? ActiveTaskId { get; set; }
    public string Avatar { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public double Efficiency { get; set; } = 1.0;
    public List<ConversationMessage> ConversationHistory { get; set; } = new();
}

public class TaskItem : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AssignedAgentId { get; set; } = string.Empty;
    public string SubsidiaryId { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending | in_progress | completed
    public int Progress { get; set; }               // 0 to 100
    public double Payout { get; set; }
    public double Cost { get; set; }
    public int Duration { get; set; }
    public List<string> Logs { get; set; } = new();
}

public class ActivityLog : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info | success | warning | agent_action | system
    public string? SubsidiaryName { get; set; }
    public string? AgentName { get; set; }
}

public class Transaction : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string SubsidiaryId { get; set; } = string.Empty; // "common" or specific subsidiary ID
    public string SubsidiaryName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Investment | Expense | Profit | Procurement | Sale
    public double Subtotal { get; set; }
    public double Discount { get; set; }
    public double Cgst { get; set; } // Central GST
    public double Sgst { get; set; } // State GST
    public double TotalAmount { get; set; } // Subtotal - Discount + Cgst + Sgst
    public double AmountPaidOrReceived { get; set; } // Actual money flow that alters cash balances
    public string Description { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty; // ISO 8601 string

    // Invoicing & Document Processing Metadata
    public string ReferenceNumber { get; set; } = string.Empty; // Invoice #, receipt ref
    public string PartnerName { get; set; } = string.Empty; // Customer / Vendor name
    public string DocumentUrl { get; set; } = string.Empty; // URL to uploaded bill
    public string ProcessedByAgentId { get; set; } = string.Empty; // ID of agent who processed this
    public string Status { get; set; } = "Completed"; // Completed, Pending, Failed
}

// ─── CRM: Lead & Follow-Up Timeline ─────────────────────────────────────────
public class LeadFollowUp
{
    public string Date { get; set; } = string.Empty;       // ISO 8601 date string
    public string Note { get; set; } = string.Empty;       // Follow-up note text
    public string CreatedBy { get; set; } = string.Empty;  // Employee/agent name who added note
}

public class Lead : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string SubsidiaryId { get; set; } = string.Empty; // "common" or specific subsidiary ID
    public string SubsidiaryName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Source { get; set; } = "Inbound";  // Inbound | Outbound | Referral | Campaign
    public string Stage { get; set; } = "New";        // New | Contacted | Qualified | Proposal | Won | Lost
    public double EstimatedValue { get; set; }         // Deal value in INR
    public string AssignedToId { get; set; } = string.Empty;   // Employee or Agent ID
    public string AssignedToName { get; set; } = string.Empty; // Display name
    public string Notes { get; set; } = string.Empty;
    public List<LeadFollowUp> FollowUps { get; set; } = new();
    public string CreatedAt { get; set; } = string.Empty;  // ISO 8601
    public string UpdatedAt { get; set; } = string.Empty;
}

// ─── Human Employee (Non-Agent) ──────────────────────────────────────────────
public class Employee : IEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;   // Job title
    public string Department { get; set; } = string.Empty;    // Engineering | Sales | Marketing | HR | Finance | Operations
    public string SubsidiaryId { get; set; } = string.Empty;
    public string SubsidiaryName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public double Salary { get; set; }                         // Monthly salary in INR
    public string JoinDate { get; set; } = string.Empty;       // ISO date string
    public string Status { get; set; } = "Active";             // Active | On Leave | Resigned
    public string ReportsToId { get; set; } = string.Empty;    // Manager ID (agent or employee)
    public string ReportsToName { get; set; } = string.Empty;  // Display name
    public string Avatar { get; set; } = "👤";
}

public class SimulationState
{
    public List<Subsidiary> Subsidiaries { get; set; } = new();
    public List<Agent> Agents { get; set; } = new();
    public List<TaskItem> Tasks { get; set; } = new();
    public List<ActivityLog> Logs { get; set; } = new();
    public List<Transaction> Transactions { get; set; } = new();
    public List<Lead> Leads { get; set; } = new();
    public List<Employee> Employees { get; set; } = new();
}
