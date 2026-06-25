# AstraCore — Agent ↔ Internal Service Communication

> **How AI agents interact with the business engine: Hire Agent, Transactions, Leads, Tasks, Subsidiaries and more**

---

## Table of Contents

1. [Overview — Two Communication Pathways](#1-overview--two-communication-pathways)
2. [The AstraCorePlugin — Agent's Gateway to Services](#2-the-astracorePlugin--agents-gateway-to-services)
3. [Pathway A — LLM Tool Calls (Agent-Initiated)](#3-pathway-a--llm-tool-calls-agent-initiated)
4. [Pathway B — NLP Director Commands (Human-Initiated)](#4-pathway-b--nlp-director-commands-human-initiated)
5. [Service-by-Service Deep Dive](#5-service-by-service-deep-dive)
   - 5.1 [Hire Agent](#51-hire-agent)
   - 5.2 [Create Task & Task Assignment](#52-create-task--task-assignment)
   - 5.3 [Transaction Recording](#53-transaction-recording)
   - 5.4 [Lead Management](#54-lead-management)
   - 5.5 [Create Subsidiary & Fund Allocation](#55-create-subsidiary--fund-allocation)
   - 5.6 [User Q&A — Blocking Question](#56-user-qa--blocking-question)
6. [Agent Group Chat — Hierarchical Communication](#6-agent-group-chat--hierarchical-communication)
7. [Activity Log Service — Broadcast Channel](#7-activity-log-service--broadcast-channel)
8. [Full Service Interaction Matrix](#8-full-service-interaction-matrix)
9. [End-to-End Scenario Walkthroughs](#9-end-to-end-scenario-walkthroughs)
10. [Data Flow Summary Diagrams](#10-data-flow-summary-diagrams)

---

## 1. Overview — Two Communication Pathways

AstraCore provides two distinct pathways through which agents (AI and human directors) interact with internal business services:

```
┌───────────────────────────────────────────────────────────────────────┐
│                   AGENT COMMUNICATION PATHWAYS                        │
│                                                                       │
│  PATHWAY A: LLM Tool Calls (Agent-Initiated)                          │
│  ─────────────────────────────────────────────                        │
│                                                                       │
│   LLM (Gemini/GPT/Gemma)                                              │
│        │                                                              │
│        │ decides to call a tool                                       │
│        ▼                                                              │
│   AstraCorePlugin  ──────────────►  Internal Services                 │
│   [KernelFunction]                  (TaskService, TransactionService, │
│                                      LeadService, AgentService, etc.) │
│                                                                       │
│  PATHWAY B: NLP Director Commands (Human-Initiated)                   │
│  ─────────────────────────────────────────────────                    │
│                                                                       │
│   Human types command in TaskTerminal                                 │
│        │                                                              │
│        │ POST /api/simulation/command                                 │
│        ▼                                                              │
│   DirectorCommandExecutor ────────► ICommandHandler (regex match)     │
│                                          │                            │
│                                          ▼                            │
│                                     Internal Services                 │
└───────────────────────────────────────────────────────────────────────┘
```

Both pathways converge on the **same set of Application Services** — ensuring that whether an action is triggered by an AI agent or a human director, the same business logic, validation, and persistence applies.

---

## 2. The AstraCorePlugin — Agent's Gateway to Services

The `AstraCorePlugin` is the **single most important bridge** in the system. It exposes internal AstraCore services as **Semantic Kernel KernelFunctions** — callable tool definitions that the LLM can invoke autonomously during task execution.

### Location
```
coreapi/Infrastructure/AI/Plugins/AstraCorePlugin.cs
```

### Plugin Registration

The plugin is registered into every Semantic Kernel instance created for any agent, inside `KernelProviderService.CreateKernel()`:

```csharp
// KernelProviderService.cs
var astraPlugin = new AstraCorePlugin(
    _serviceProvider.GetRequiredService<ITaskService>(),
    _serviceProvider.GetRequiredService<ITransactionService>(),
    _serviceProvider.GetRequiredService<IAgentService>(),
    _serviceProvider.GetRequiredService<ISubsidiaryService>(),
    _serviceProvider.GetRequiredService<ILeadService>(),
    defaultSubsidiaryId       // agent's home subsidiary
);
builder.Plugins.AddFromObject(astraPlugin, "AstraCore");
```

This means **every agent kernel** has access to all 5 tool functions. The LLM decides which tools to call based on its instructions and the task at hand.

### Plugin Tools Catalog

| KernelFunction | Exposed As | Calls Service |
|---|---|---|
| `CreateTask` | `AstraCore-CreateTask` | `ITaskService.CreateTaskAsync()` |
| `CreateTransaction` | `AstraCore-CreateTransaction` | `ITransactionService.RecordTransactionAsync()` |
| `CreateLead` | `AstraCore-CreateLead` | `ILeadService.CreateLeadAsync()` |
| `HireAgent` | `AstraCore-HireAgent` | `IAgentService.HireAgentAsync()` |
| `AskQuestionToUser` | `AstraCore-AskQuestionToUser` | Intercepted by `TaskProcessorService` |

### Subsidiary Context Resolution

Every plugin function accepts an optional `subsidiaryNameOrId` parameter. The plugin resolves it via `ResolveSubsidiaryIdAsync()`:

```
subsidiaryNameOrId provided?
        │
        ├─ YES → Search ISubsidiaryService by exact ID or name (case-insensitive)
        │         └─ Returns matched subsidiary's ID
        │
        └─ NO  → Falls back to _defaultSubsidiaryId
                  (the agent's own subsidiary, passed at kernel creation time)
```

This means an agent working in "TechCore Subsidiary" will automatically target that subsidiary for all operations unless explicitly told otherwise.

---

## 3. Pathway A — LLM Tool Calls (Agent-Initiated)

This is the **autonomous pathway**. During task execution, the LLM agent decides to call plugin functions based on its reasoning.

### Complete Flow Diagram

```
User/System starts a task
         │
         ▼
TaskService.StartTaskAsync(taskId)
         │
         ├─ agent.Status  = "working"
         ├─ task.Status   = "in_progress"
         └─ Launches background thread:
              │
              ▼
         Task.Run(() => TaskProcessorService.ProcessTaskAsync(taskId))
                        │
                        ▼
              KernelProviderService.CreateKernel(agent.ModelId, subsidiaryId)
                        │
                        ├─► Configures LLM backend (Gemini / OpenAI / Ollama)
                        └─► Registers AstraCorePlugin with 5 tools
                        │
                        ▼
              ChatCompletionAgent created:
                Name: agent.Name
                Instructions: "You are {name}, a {role}. {instructions}
                               Process the following task..."
                        │
                        ▼
              LLM InvokeAsync(chatHistory) -- streaming
                        │
              ┌─────────┴──────────────────────────┐
              │  LLM REASONING LOOP                 │
              │                                     │
              │  Reads task title + description     │
              │            │                        │
              │            ▼                        │
              │  Decides → call AstraCore tool?     │
              │            │                        │
              │      YES   │   NO                   │
              │            ▼        ▼               │
              │  LLM calls     LLM writes text      │
              │  KernelFn      output directly      │
              │            │                        │
              │            ▼                        │
              │  AstraCorePlugin.{Fn}Async()        │
              │      calls Application Service      │
              │      returns string result to LLM   │
              │            │                        │
              │            ▼                        │
              │  LLM incorporates result, continues │
              └─────────────────────────────────────┘
                        │
                        ▼
              Collect full output text
                        │
                        ├─ Contains "[BLOCKING_QUESTION]:"?
                        │     └─► task.Status = "blocked_on_user"
                        │         task.PendingQuestion = extracted question
                        │
                        └─ Normal completion?
                              task.Output = collected text
                              task.Progress = 100
```

### Tool Call Execution Mechanics

When the LLM decides to call a tool (e.g., `AstraCore-CreateTransaction`):

```
LLM generates structured tool call:
{
  "tool": "AstraCore-CreateTransaction",
  "args": {
    "type": "Sale",
    "totalAmount": 50000,
    "description": "Sold 100 units of Product X",
    "partnerName": "Acme Corp"
  }
}
         │
         ▼
Semantic Kernel intercepts the tool call
         │
         ▼
Calls AstraCorePlugin.CreateTransactionAsync(
  type: "Sale",
  totalAmount: 50000,
  description: "Sold 100 units of Product X",
  partnerName: "Acme Corp",
  subsidiaryNameOrId: ""   ← empty = use agent's default subsidiary
)
         │
         ▼
ITransactionService.RecordTransactionAsync(...)
  ├─ Calculates GST (18% split as 9% CGST + 9% SGST)
  ├─ Updates subsidiary Balance and Profits
  ├─ Writes Transaction record to DB
  └─ Writes ActivityLog entry
         │
         ▼
Returns: "Transaction of type 'Sale' for 50000 INR recorded
          successfully with reference REF-123456"
         │
         ▼
LLM receives the success string → continues reasoning
```

---

## 4. Pathway B — NLP Director Commands (Human-Initiated)

This is the **director-driven pathway**. A human types a natural language instruction in the TaskTerminal UI. The backend parses and routes it to the appropriate service.

### Complete Flow Diagram

```
Human types in TaskTerminal:
  "hire Developer named Arun for TechCore"
         │
         ▼
Frontend: dispatch(parseCommandRequest({ command }))
         │
         ▼
Redux-Saga: api.parseDirectorCommand(command)
         │
         ▼
POST /api/simulation/command
  { "command": "hire Developer named Arun for TechCore" }
         │
         ▼
SimulationController.ExecuteCommand(req)
         │
         ▼
DirectorCommandExecutor.ExecuteAsync(command)
         │
         ▼  (iterates ICommandHandler[] in DI registration order)
         │
         ├─► CreateSubsidiaryCommandHandler.CanHandle() → FALSE
         │     (regex: "create subsidiary ... with ...")
         │
         ├─► HireAgentCommandHandler.CanHandle() → TRUE
         │     (regex: "hire|create agent {role} named {name} for {subsidiary}")
         │              │
         │              ▼
         │         HireAgentCommandHandler.HandleAsync(command)
         │              │
         │              ├─ Extracts: role="Developer", name="Arun", sub="TechCore"
         │              ├─ Validates role against VALID_ROLES[]
         │              ├─ Resolves subsidiary by name (fuzzy match)
         │              └─ Calls IAgentService.HireAgentAsync("Arun", "Developer", sub.Id)
         │                         │
         │                         └─ Returns CommandResult(true, "Confirmed. Deployed...")
         │
         ▼
DirectorCommandResponse {
  Success: true,
  Text: "Confirmed. I have deployed Developer Arun to the TechCore network node.",
  State: <full SimulationState snapshot>
}
         │
         ▼
Frontend parses response, shows success message, updates Redux store
```

### Director Command Grammar

| Command Template | Handler | Regex Pattern |
|---|---|---|
| `create subsidiary {Name} with {₹Amount}` | `CreateSubsidiaryCommandHandler` | `create\s+subsidiary\s+([...]+)\s+with\s+(?:₹|\$)?(\d+)` |
| `hire {Role} named {Name} for {Subsidiary}` | `HireAgentCommandHandler` | `(?:hire\|create\s+agent)\s+([...]+)\s+named\s+([...]+)\s+for\s+([...]+)` |
| `allocate {Amount} to {Subsidiary}` | `AllocateFundsCommandHandler` | `(?:allocate\|give\|invest)\s+(?:₹\|\$)?(\d+)\s+to\s+([...]+)` |
| `assign task {Title} to {AgentName}` | `AssignTaskCommandHandler` | `assign\s+(?:task\s+)?([...]+)\s+to\s+([...]+)` |
| `status` / `report` / `show` | `StatusCommandHandler` | (keyword match) |

### Handler Registration Order

Handlers are registered in `Program.cs` in this order (first match wins):

```csharp
services.AddSingleton<ICommandHandler, CreateSubsidiaryCommandHandler>(); // 1st
services.AddSingleton<ICommandHandler, HireAgentCommandHandler>();        // 2nd
services.AddSingleton<ICommandHandler, AllocateFundsCommandHandler>();    // 3rd
services.AddSingleton<ICommandHandler, AssignTaskCommandHandler>();        // 4th
services.AddSingleton<ICommandHandler, StatusCommandHandler>();            // 5th
```

---

## 5. Service-by-Service Deep Dive

---

### 5.1 Hire Agent

An agent can be hired through **two pathways**: NLP Director Command or LLM Tool Call.

#### Service: `AgentService.HireAgentAsync()`

```csharp
// Full signature
Task<Agent> HireAgentAsync(
    string name,
    string role,
    string subsidiaryId,
    string? instructions = null,
    string? modelId = null,
    AgentRoleDefinition? customOverrides = null
)
```

#### Internal Steps

```
HireAgentAsync("Arun", "Developer", "sub-1234")
         │
         1. Validate subsidiary exists
         │    └─ IRepository<Subsidiary>.GetByIdAsync(subsidiaryId)
         │    └─ Throws EntityNotFoundException if not found
         │
         2. Seed role blueprints if not already done
         │    └─ EnsureRolesSeededAsync()
         │         └─ If role_blueprints collection is empty:
         │              seeds 60 pre-built RoleBlueprint records to DB
         │
         3. Load matching RoleBlueprint from DB
         │    └─ IRepository<RoleBlueprint>.GetAllAsync()
         │    └─ Find: Name == "Developer" (case-insensitive)
         │    └─ If not found: use generic default blueprint
         │
         4. Apply custom overrides (if any)
         │    └─ Merges customOverrides.Temperature / MaxTokens /
         │         OutputFormat / MemoryType / Tools on top of blueprint
         │
         5. Build instructions if not provided
         │    └─ "You are {name}, an AI agent with role {role}.
         │         Core skills: {skills}. Execute tasks with precision..."
         │
         6. Create Agent entity
         │    └─ Id: "agent-{unix-ms}"
         │    └─ Status: "idle"
         │    └─ Level: 1
         │    └─ Efficiency: random 0.8–1.4
         │    └─ Avatar: role-specific emoji
         │    └─ ConversationHistory: [{ role:"system", content: instructions }]
         │
         7. Save to DB
         │    └─ IRepository<Agent>.SaveAsync(agent)
         │
         8. Write activity log
              └─ ILogService.AddLogAsync(
                   "AI Agent '{name}' ({role}) deployed under {subsidiary}...",
                   "agent_action"
                 )
```

#### Pathway Comparison for HireAgent

| Aspect | Via LLM Tool Call | Via Director Command |
|---|---|---|
| Trigger | LLM decides autonomously | Human types command |
| Entry point | `AstraCorePlugin.HireAgentAsync()` | `HireAgentCommandHandler.HandleAsync()` |
| Role validation | None (trusts LLM) | Validated against VALID_ROLES[] |
| Subsidiary lookup | `ResolveSubsidiaryIdAsync()` by name or ID | `ISubsidiaryService.GetAllAsync()` + fuzzy match |
| Calls service | `IAgentService.HireAgentAsync()` | `IAgentService.HireAgentAsync()` |
| Response | String result back to LLM | `CommandResult` → HTTP JSON |

---

### 5.2 Create Task & Task Assignment

#### Service: `TaskService.CreateTaskAsync()`

```csharp
Task<TaskItem> CreateTaskAsync(
    string title,
    string description,
    string subsidiaryId,
    string assignedAgentId
)
```

#### Internal Steps

```
CreateTaskAsync("Design landing page", "Create a modern...", "sub-1234", "agent-5678")
         │
         1. Create TaskItem entity
         │    └─ Id: "task-{unix-ms}"
         │    └─ Status: "pending"
         │    └─ Progress: 0
         │    └─ Duration: random 10–25 (simulation ticks)
         │    └─ Logs: ["Task pipeline initialized..."]
         │
         2. Save to DB
         │    └─ IRepository<TaskItem>.SaveAsync(task)
         │
         3. Auto-start if agent is idle
              └─ IRepository<Agent>.GetByIdAsync(assignedAgentId)
              └─ if agent.Status == "idle":
                   └─► StartTaskAsync(task.Id)
```

#### Task Start Flow

```
StartTaskAsync(taskId)
         │
         1. Load task + agent + subsidiary from DB
         │    └─ Validates all exist (throws EntityNotFoundException if not)
         │
         2. Guard: task must not already be in_progress
         3. Guard: agent must be "idle" (throws AgentBusyException)
         │
         4. Update Agent in DB:
         │    └─ agent.Status = "working"
         │    └─ agent.ActiveTaskId = task.Id
         │
         5. Update Task in DB:
         │    └─ task.Status = "in_progress"
         │    └─ task.Logs.Add("Agent started execution...")
         │
         6. Write ActivityLog:
         │    └─ "Agent {name} ({role}) deployed to task: {title}"
         │
         7. Fire and forget background LLM execution:
              └─ IServiceProvider.GetRequiredService<ITaskProcessorService>()
              └─ Task.Run(() => processor.ProcessTaskAsync(task.Id))
              └─ Returns immediately to HTTP caller
              └─ LLM runs in background thread
```

#### Task Status State Machine

```
              ┌───────────┐
              │  pending  │ ← task created, agent not yet started
              └─────┬─────┘
                    │ StartTaskAsync()
                    ▼
           ┌─────────────────┐
           │   in_progress   │ ← agent is working (LLM running in background)
           └────────┬────────┘
                    │
         ┌──────────┴────────────┐
         │                       │
         ▼                       ▼
  ┌──────────────┐      ┌─────────────────────┐
  │  completed   │      │  blocked_on_user     │
  │              │      │  (LLM asked a        │
  │ task.Output  │      │   question)          │
  │ task.Progress│      └──────────┬───────────┘
  │  = 100       │                 │ ResumeTaskAsync(answer)
  └──────────────┘                 │
                                   ▼
                          ┌──────────────────┐
                          │   in_progress    │ ← resumes LLM
                          └──────────────────┘
```

#### Task Resume Flow (User Answers Agent Question)

```
Frontend: api.answerTaskQuestion(taskId, "The budget is ₹200,000")
         │
         ▼
POST /api/simulation/task/{taskId}/answer  { answer: "..." }
         │
         ▼
TaskService.ResumeTaskAsync(taskId, answer)
         │
         1. Load task, verify Status == "blocked_on_user"
         2. Append to task.Description:
         │    "[Agent Asked]: {pendingQuestion}\n[User Answered]: {answer}\n
         │     [System]: Please continue processing..."
         3. task.PendingAnswer = answer
         4. task.PendingQuestion = "" (cleared)
         5. task.Status = "in_progress"
         6. task.Logs.Add("User provided answer. Resuming execution...")
         7. Save to DB
         8. Fire and forget: Task.Run(() => processor.ProcessTaskAsync(task.Id))
```

---

### 5.3 Transaction Recording

#### Service: `TransactionService.RecordTransactionAsync()`

```csharp
Task<Transaction> RecordTransactionAsync(
    string subsidiaryId,
    string type,           // Investment | Expense | Profit | Procurement | Sale
    double subtotal,
    double discount,
    double cgst,           // 9% Central GST
    double sgst,           // 9% State GST
    double totalAmount,
    double amountPaidOrReceived,
    string description,
    string referenceNumber = "",
    string partnerName = "",
    string documentUrl = "",
    string processedByAgentId = "",
    string status = "Completed"
)
```

#### Internal Steps & Balance Sheet Logic

```
RecordTransactionAsync("sub-1234", "Sale", ...)
         │
         1. Load subsidiary from DB
         │
         2. Apply financial impact based on transaction type:
         │
         │    "Investment" ──► sub.Balance     += amountPaidOrReceived
         │                     sub.Investment  += amountPaidOrReceived
         │
         │    "Expense"    ──► sub.Balance     -= amountPaidOrReceived
         │    "Procurement"    sub.Expenses    += amountPaidOrReceived
         │                     (Procurement also: sub.Procurements++)
         │
         │    "Profit"     ──► sub.Balance     += amountPaidOrReceived
         │    "Sale"            sub.Profits    += amountPaidOrReceived
         │                     (Sale also: sub.Sales++)
         │
         3. Save updated subsidiary to DB
         │
         4. Create Transaction record:
         │    └─ Id: "tx-{unix-ms}-{random4chars}"
         │    └─ Timestamp: ISO 8601 UTC
         │
         5. Save Transaction to DB
         │
         6. Write ActivityLog:
              └─ "LEDGER: Recorded {type} of ₹{amount} for {subsidiary}..."
```

#### How the LLM Plugin Auto-Calculates GST

When called from `AstraCorePlugin.CreateTransactionAsync()`, GST is auto-derived from `totalAmount`:

```csharp
// AstraCorePlugin.cs
double subtotal = Math.Round(totalAmount / 1.18, 2);    // back-calculate from 18% total
double tax      = Math.Round(subtotal * 0.09, 2);        // 9% CGST = 9% SGST
```

This means the LLM only needs to provide `totalAmount` — the service handles the GST split automatically.

#### Transaction Triggers (Who Can Create Transactions)

| Trigger Source | Call Chain |
|---|---|
| LLM Agent (autonomously) | `AstraCorePlugin.CreateTransactionAsync()` → `ITransactionService` |
| Human Director (UI modal) | `POST /api/simulation/transaction` → `SimulationController` → `ITransactionService` |
| Subsidiary Creation | `SubsidiaryService.CreateSubsidiaryAsync()` → `ITransactionService` (seed investment) |
| Fund Allocation | `SubsidiaryService.AllocateFundsAsync()` → `ITransactionService` |

---

### 5.4 Lead Management

#### Service: `LeadService.CreateLeadAsync()`

```csharp
Task<Lead> CreateLeadAsync(
    string subsidiaryId,
    string contactName,
    string companyName,
    string email = "",
    string phone = "",
    string source = "Inbound",    // Inbound | Outbound | Referral | Campaign | AI Agent
    string stage = "New",         // New | Contacted | Qualified | Proposal | Won | Lost
    double estimatedValue = 0,
    string assignedToId = "",
    string assignedToName = "",
    string notes = ""
)
```

#### Internal Steps

```
CreateLeadAsync("sub-1234", "Priya Sharma", "Nexus Corp", ...)
         │
         1. Resolve subsidiary name from ID
         │    └─ IRepository<Subsidiary>.GetByIdAsync(subsidiaryId)
         │
         2. Create Lead entity:
         │    └─ Id: "lead-{unix-ms}-{random4digits}"
         │    └─ Source: "AI Agent" (when called from plugin)
         │         or "Inbound" / "Outbound" / etc. (when from UI)
         │    └─ FollowUps: []
         │
         3. Auto-create initial follow-up if notes provided:
         │    └─ FollowUps.Add({ Date, Note: notes, CreatedBy: assignedToName })
         │
         4. Save Lead to DB
```

#### Lead Pipeline Stage Updates

```
UpdateLeadStageAsync(leadId, "Qualified", "Had a great demo call", "Alice")
         │
         1. Load lead from DB
         2. lead.Stage = "Qualified"
         3. lead.UpdatedAt = now
         4. FollowUps.Add({
               Date: now,
               Note: "[Qualified] Had a great demo call",
               CreatedBy: "Alice"
            })
         5. Save Lead to DB
```

#### Lead Triggers

| Trigger Source | Source Field | Call Chain |
|---|---|---|
| LLM Agent creates a lead | `"AI Agent"` | `AstraCorePlugin.CreateLeadAsync()` → `ILeadService` |
| Human via CRM UI | `"Inbound"` etc. | `POST /api/leads` → `LeadsController` → `ILeadService` |
| Stage update (UI) | — | `PUT /api/leads/{id}/stage` → `LeadsController` → `ILeadService.UpdateLeadStageAsync()` |

---

### 5.5 Create Subsidiary & Fund Allocation

#### Service: `SubsidiaryService.CreateSubsidiaryAsync()`

```csharp
Task<Subsidiary> CreateSubsidiaryAsync(
    string name,
    string industry,
    double investment,
    string? colorTheme = null,
    string? logoUrl = null,
    string? website = null,
    string? email = null,
    string? phone = null,
    string? description = null,
    string? address = null,
    string? bankDetails = null
)
```

#### Internal Steps

```
CreateSubsidiaryAsync("TechCore", "AI Software", 500000)
         │
         1. Pick random color theme from 5 preset gradients
         │    (unless colorTheme override provided)
         │
         2. Pick random icon (Cpu, Palette, DollarSign, etc.)
         │
         3. Create Subsidiary entity:
         │    └─ Id: "sub-{unix-ms}"
         │    └─ Investment: 0, Balance: 0 (will be set via Transaction)
         │
         4. Save to DB
         │
         5. If investment > 0:
         │    └─► ITransactionService.RecordTransactionAsync(
         │           type: "Investment",
         │           description: "Initial seed investment funding",
         │           referenceNumber: "INV-SEED-{auto}",
         │           partnerName: "Parent Enterprise"
         │        )
         │        └─ This updates Subsidiary.Balance and .Investment
         │        └─ Creates a Transaction record in DB
         │        └─ Writes ActivityLog
         │
         └─ If investment == 0:
              └─ ILogService.AddLogAsync("Subsidiary created with zero funding")
```

#### Fund Allocation (After-the-Fact Investment)

```
AllocateFundsAsync("sub-1234", 250000)
         │
         1. Validate subsidiary exists
         2. Calls ITransactionService.RecordTransactionAsync(
                type: "Investment",
                description: "Capital funding allocation",
                referenceNumber: "INV-ALLOC-{auto}"
            )
            └─ Same transaction logic: Balance += amount, Investment += amount
```

Note: Subsidiaries are **not directly created by agents** via LLM tool calls — this is a Director-only capability.

---

### 5.6 User Q&A — Blocking Question

When an agent encounters ambiguity it cannot resolve, it can pause execution and ask the user:

#### How the Agent Asks a Question

The LLM writes a special token in its output:

```
LLM output contains:
"[BLOCKING_QUESTION]: What is the maximum budget approved for this project?"
```

#### TaskProcessorService Detection

```csharp
// TaskProcessorService.cs
if (content.Contains("[BLOCKING_QUESTION]:"))
{
    isBlocked = true;
    var questionIndex = content.IndexOf("[BLOCKING_QUESTION]:") + "[BLOCKING_QUESTION]:".Length;
    var question = content.Substring(questionIndex).Trim();

    task.Status = "blocked_on_user";
    task.PendingQuestion = question;
    await _taskRepository.SaveAsync(task);
    break; // Stop streaming
}
```

#### Full Q&A Lifecycle

```
LLM generates "[BLOCKING_QUESTION]: What is the budget?"
         │
         ▼
TaskProcessorService detects the token
         │
         ▼
task.Status = "blocked_on_user"
task.PendingQuestion = "What is the budget?"
Task saved to DB
         │
         ▼
Next tick → Frontend shows task in QuestionBoard
         │
         ▼
Human clicks task, sees question, types answer: "₹200,000"
         │
         ▼
api.answerTaskQuestion(taskId, "₹200,000")
         │
         ▼
POST /api/simulation/task/{taskId}/answer
         │
         ▼
TaskService.ResumeTaskAsync(taskId, "₹200,000")
         │
         ├─ Appends Q&A to task.Description
         ├─ task.Status = "in_progress"
         └─ Fires new Task.Run(processor.ProcessTaskAsync(task.Id))
              │
              └─ LLM re-runs with full context including the answer
                 → completes normally
```

---

## 6. Agent Group Chat — Hierarchical Communication

When a user opens a direct chat with an agent, AstraCore creates a **group chat** that includes the primary agent and all its subsidiary peers.

### How GroupChatService Works

```
User opens chat with "Alice (Developer)" in TechCore subsidiary
         │
         ▼
POST /api/chat { agentId: "agent-alice", message: "...", history: [...] }
         │
         ▼
GroupChatService.RunHierarchicalChatAsync("agent-alice", message, history)
         │
         1. Load primary agent from DB (Alice)
         │
         2. Load ALL agents in the same subsidiary
         │    └─ Filter: SubsidiaryId == Alice.SubsidiaryId AND Id != Alice.Id
         │    └─ Result: [Bob (CEO), Carol (CFO), Dave (Marketer)] ← peers
         │
         3. Create SK ChatCompletionAgent for EACH agent:
         │
         │    Primary (Alice):
         │      Instructions: "You are Alice, a Developer...
         │                     Talk directly to the user.
         │                     Ask other agents if needed."
         │
         │    Peers:
         │      Instructions: "You are Bob, a CEO...
         │                     You are assisting Alice.
         │                     Only respond if Alice explicitly asks you."
         │
         4. Create AgentGroupChat with SequentialSelectionStrategy
         │    └─ InitialAgent = Alice (primary)
         │
         5. Load chat history into group chat
         6. Add user message
         │
         7. chat.InvokeAsync() → runs agents sequentially
         │    └─ Alice responds first
         │    └─ If Alice asks "Bob, what's our Q3 budget?" → Bob responds
         │    └─ DefaultTerminationStrategy terminates after primary responds
         │
         8. Collect all messages as ResultMessageDto[]
              └─ { Role, Content, Author: agentName }
```

### Agent-to-Agent Communication Pattern

```
User: "What's the company strategy?"
         │
         ▼
Alice (Developer) receives the question
         │
         ▼
Alice decides: "This is a strategic question, I should ask the CEO."
         │
         ▼
Alice writes: "Bob, what is the current company strategy?"
         │
         ▼
Bob (CEO) responds with the strategy briefing
         │
         ▼
Alice synthesizes Bob's answer + her own dev perspective
         │
         ▼
Alice writes final response to user
         │
         ▼
User sees multi-agent collaborative reply
```

---

## 7. Activity Log Service — Broadcast Channel

Every significant internal service action writes to the `ActivityLog`. This acts as an **audit trail** and **real-time activity feed** visible in the frontend.

### How Services Write Logs

All major services inject `ILogService` and call:

```csharp
await _logService.AddLogAsync(
    message: "Agent Alice (Developer) deployed to task: 'Design UI'",
    type: "agent_action",             // info | success | warning | agent_action | system
    subsidiaryName: "TechCore",       // optional
    agentName: "Alice"                // optional
);
```

### Log Sources by Service

| Service | When It Logs | Log Type |
|---|---|---|
| `AgentService.HireAgentAsync()` | Agent created | `agent_action` |
| `TaskService.StartTaskAsync()` | Task started | `agent_action` |
| `TaskService` via `SimulationEngine` | Task completed | `success` |
| `TaskProcessorService` | LLM inference started | `info` |
| `TaskProcessorService` | Error during LLM | `warning` |
| `TransactionService` | Every transaction | `info` |
| `SubsidiaryService` | Subsidiary created | `info` |

### Log Retention Policy

The `LogService` keeps only the **last 100 logs** — older logs are purged automatically:

```csharp
if (allLogs.Count > 100)
{
    var logsToRemove = allLogs.OrderByDescending(...).Skip(100);
    foreach (var oldLog in logsToRemove)
        await _logRepository.DeleteAsync(oldLog.Id);
}
```

---

## 8. Full Service Interaction Matrix

This table shows **who calls what** across every actor in AstraCore:

| Actor | Creates Task | Records Transaction | Creates Lead | Hires Agent | Creates Subsidiary | Allocates Funds |
|---|---|---|---|---|---|---|
| **LLM Agent (tool call)** | ✅ `AstraCorePlugin.CreateTask` | ✅ `AstraCorePlugin.CreateTransaction` | ✅ `AstraCorePlugin.CreateLead` | ✅ `AstraCorePlugin.HireAgent` | ❌ | ❌ |
| **Director NLP Command** | ✅ `AssignTaskCommandHandler` | ❌ | ❌ | ✅ `HireAgentCommandHandler` | ✅ `CreateSubsidiaryCommandHandler` | ✅ `AllocateFundsCommandHandler` |
| **Human via UI** | ✅ `POST /simulation/task` | ✅ `POST /simulation/transaction` | ✅ `POST /leads` | ✅ `POST /simulation/agent` | ✅ `POST /simulation/subsidiary` | ✅ `POST /simulation/allocate-funds` |
| **SubsidiaryService** | ❌ | ✅ (seed investment) | ❌ | ❌ | — | — |
| **SimulationEngine (tick)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 9. End-to-End Scenario Walkthroughs

### Scenario A — CEO Agent Autonomously Hires a Developer

```
Task created: "Expand the engineering team — hire a Python developer"
         │
         ▼
CEO agent (Alice) receives task with LLM
         │
         ▼
LLM decides: "I should hire a Developer for this subsidiary"
         │
         ▼
LLM calls: AstraCore-HireAgent {
  name: "Rohan",
  role: "Developer",
  instructions: "You are Rohan, a Python specialist...",
  modelId: "gemma4:latest"
  // subsidiaryNameOrId: "" → uses agent's default subsidiary
}
         │
         ▼
AstraCorePlugin.HireAgentAsync()
  └─► AgentService.HireAgentAsync("Rohan", "Developer", "sub-1234")
         │
         ├─ Loads Developer RoleBlueprint from DB
         ├─ Sets temperature=0.2, maxTokens=8192, outputFormat="code"
         ├─ Creates Agent entity (Id: "agent-{ms}")
         ├─ Saves to agents collection
         └─ Logs: "AI Agent 'Rohan' (Developer) deployed under TechCore"
         │
         ▼
LLM receives: "Agent 'Rohan' hired successfully as Developer with ID agent-1234"
         │
         ▼
LLM writes final task output:
  "Team expansion complete. New Python Developer 'Rohan' has been deployed
   to TechCore with ID agent-1234 and is ready for task assignment."
         │
         ▼
task.Output = above text
task.Progress = 100
task.Status remains "in_progress" → next tick sets "completed"
         │
         ▼
ActivityLogs updated → Frontend reflects new agent card + task completion
```

---

### Scenario B — Marketer Agent Creates a Lead from Research

```
Task created: "Identify potential clients in the healthcare space and log leads"
         │
         ▼
Marketer agent (Maya) receives task with LLM
         │
         ▼
LLM researches (internally generates a list of companies)
         │
         ▼
LLM calls: AstraCore-CreateLead {
  contactName: "Dr. Suresh Kumar",
  companyName: "MedTech Solutions",
  email: "suresh@medtech.io",
  stage: "New",
  estimatedValue: 1500000
}
         │
         ▼
AstraCorePlugin.CreateLeadAsync()
  └─► LeadService.CreateLeadAsync(
       subsidiaryId: "sub-1234",  // resolved from agent's default
       contactName: "Dr. Suresh Kumar",
       companyName: "MedTech Solutions",
       source: "AI Agent",        // agent-originated leads tagged as "AI Agent"
       stage: "New",
       estimatedValue: 1500000
     )
         │
         ├─ Creates Lead entity (Id: "lead-{ms}-{rand}")
         └─ Saves to leads collection
         │
         ▼
LLM receives: "Lead 'Dr. Suresh Kumar' at 'MedTech Solutions' created with ID lead-1234"
         │
         ▼
LLM continues: calls CreateLead for 2 more companies
         │
         ▼
Final task output: "3 healthcare leads logged: MedTech Solutions (₹15L),
                    CarePlus Ltd (₹8L), Diagnostix Corp (₹12L)"
         │
         ▼
LeadCRM board on frontend shows 3 new cards in "New" stage
```

---

### Scenario C — CFO Agent Records an Expense Transaction

```
Task created: "Process the server infrastructure invoice from AWS - ₹85,000"
         │
         ▼
CFO agent (Bob) receives task
         │
         ▼
LLM calls: AstraCore-CreateTransaction {
  type: "Expense",
  totalAmount: 85000,
  description: "AWS cloud infrastructure monthly invoice",
  partnerName: "Amazon Web Services"
}
         │
         ▼
AstraCorePlugin.CreateTransactionAsync()
  │
  ├─ Auto-calculates GST:
  │    subtotal = 85000 / 1.18 = ₹72,033.90
  │    CGST = SGST = ₹6,483.05 each
  │    referenceNumber = "REF-{auto}"
  │
  └─► TransactionService.RecordTransactionAsync(
       subsidiaryId: "sub-1234",
       type: "Expense",
       subtotal: 72033.90,
       cgst: 6483.05, sgst: 6483.05,
       totalAmount: 85000,
       amountPaidOrReceived: 85000,
       ...
     )
         │
         ├─ subsidiary.Balance  -= 85000  (cash outflow)
         ├─ subsidiary.Expenses += 85000
         ├─ Saves updated subsidiary to DB
         ├─ Creates Transaction record in DB
         └─ Logs: "LEDGER: Recorded Expense of ₹85,000 for TechCore..."
         │
         ▼
LLM receives: "Transaction of type 'Expense' for 85000 INR recorded
               successfully with reference REF-123456"
         │
         ▼
task.Output = "AWS invoice ₹85,000 processed and recorded. Reference: REF-123456"
         │
         ▼
BalanceSheet on frontend reflects updated subsidiary balance
```

---

## 10. Data Flow Summary Diagrams

### Plugin-to-Service Data Flow

```
                 ┌─────────────────────────────────────────────┐
                 │            LLM (Gemini / OpenAI / Gemma)    │
                 │                                             │
                 │  "I need to create a transaction..."        │
                 │                │                            │
                 │   Calls tool: AstraCore-CreateTransaction   │
                 └────────────────┼────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    AstraCorePlugin      │
                    │  (Infrastructure/AI/   │
                    │   Plugins/)             │
                    │                         │
                    │  ResolveSubsidiaryId()  │
                    │  AutoCalculateGST()     │
                    └─────────────┬───────────┘
                                  │
          ┌───────────────────────┼──────────────────────────────┐
          │                       │                              │
          ▼                       ▼                              ▼
  ┌───────────────┐    ┌─────────────────────┐    ┌─────────────────┐
  │  ITaskService │    │ITransactionService  │    │   ILeadService  │
  └───────┬───────┘    └──────────┬──────────┘    └────────┬────────┘
          │                       │                         │
          ▼                       ▼                         ▼
  ┌────────────────────────────────────────────────────────────────┐
  │               IRepository<T> (Generic Repository)             │
  └─────────────────────────────┬──────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌────────────┐         ┌──────────────┐
             │  LiteDbStore│         │ MongoDbStore │
             │  (dev)     │         │ (production) │
             └────────────┘         └──────────────┘
```

### Director Command Data Flow

```
TaskTerminal UI
       │  command text
       ▼
Frontend (Redux-Saga)
       │  POST /api/simulation/command
       ▼
SimulationController
       │
       ▼
DirectorCommandExecutor
       │  iterates handlers
       ├──► CreateSubsidiaryCommandHandler
       ├──► HireAgentCommandHandler ◄── (matched)
       │         │  regex parse
       │         ▼
       │    IAgentService.HireAgentAsync()
       │    ISubsidiaryService.GetAllAsync()
       │         │
       │         ▼
       │    IRepository<Agent>.SaveAsync()
       │    ILogService.AddLogAsync()
       │         │
       │         ▼
       │    CommandResult(true, "Deployed...")
       │
       ▼
SimulationEngine.GetStateAsync()  ← fresh state snapshot
       │
       ▼
HTTP Response: { success, text, state }
       │
       ▼
Frontend Redux updates all slices
```

### Task Execution Data Flow

```
POST /api/simulation/start-task
       │
       ▼
TaskService.StartTaskAsync()
  agent.Status = "working"    ─── Save ──► agents collection (DB)
  task.Status = "in_progress" ─── Save ──► tasks collection (DB)
  ILogService.AddLogAsync()   ─── Save ──► logs collection (DB)
       │
       └── Task.Run() ─────────────────────────────────────────┐
                                                                │
                               TaskProcessorService.ProcessTaskAsync()
                                      │
                               KernelProviderService.CreateKernel()
                                      │
                               ┌──────┴────────────────────────┐
                               │    SK Kernel with:             │
                               │    - LLM backend configured    │
                               │    - AstraCorePlugin loaded    │
                               └──────┬────────────────────────┘
                                      │
                               LLM streaming response
                                      │
                          ┌──────────┬┴─────────────┐
                          │          │               │
                     Tool calls  Text output  BLOCKING_QUESTION
                          │          │               │
                   AstraPlugin  Accumulate     Pause task,
                   calls svc    outputText     write question
                          │          │         to DB
                          │          └────────────────────┐
                          └──────────────────────────────►│
                                                         task.Output = text
                                                         task.Progress = 100
                                                         Save to DB
```

---

*This document covers every agent ↔ service communication pathway in AstraCore. Cross-reference with `BACKEND_ARCHITECTURE.md` for the clean architecture layer details and `FRONTEND_ARCHITECTURE.md` for how the frontend observes these service interactions.*
