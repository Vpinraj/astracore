# AstraCore — Backend Architecture

> **Stack**: .NET 10 · ASP.NET Core · Microsoft Semantic Kernel 1.77 · LiteDB / MongoDB · Clean Architecture

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Clean Architecture Layers](#3-clean-architecture-layers)
4. [Project Structure](#4-project-structure)
5. [Layer-by-Layer Deep Dive](#5-layer-by-layer-deep-dive)
6. [Domain Model](#6-domain-model)
7. [Dependency Injection & Service Registration](#7-dependency-injection--service-registration)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [AI Integration Architecture](#9-ai-integration-architecture)
10. [Persistence Layer](#10-persistence-layer)
11. [Simulation Engine](#11-simulation-engine)
12. [NLP Command System](#12-nlp-command-system)
13. [Key Workflows](#13-key-workflows)
14. [Configuration & Secrets](#14-configuration--secrets)

---

## 1. Overview

AstraCore's backend is a **.NET 10 ASP.NET Core Web API** built on **Clean Architecture** principles. It serves as the brain of an AI-powered multi-subsidiary business simulator, integrating:

- **Microsoft Semantic Kernel** for LLM-powered agent intelligence
- **Multi-provider AI support** (Gemini, OpenAI, Local Ollama)
- **Dual-database strategy** (LiteDB for dev, MongoDB for production)
- **Simulation engine** that drives autonomous agent behavior
- **NLP command parser** for natural-language director instructions

```
┌─────────────────────────────────────────────────────────────────┐
│                    AstraCore Backend (.NET 10)                    │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │   Presentation   │  REST Controllers (11 controllers)        │
│  │   Layer          │  Filters (ApiExceptionFilter)             │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────▼─────────┐                                           │
│  │   Application    │  Services, Commands, DTOs                 │
│  │   Layer          │  Simulation Engine, AI Services           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────▼─────────┐                                           │
│  │   Core / Domain  │  Entities, Repository interfaces          │
│  │   Layer          │  Domain exceptions                        │
│  └────────┬─────────┘                                           │
│           │                                                     │
│  ┌────────▼─────────┐                                           │
│  │  Infrastructure  │  LiteDB / MongoDB persistence             │
│  │  Layer           │  AI Providers (Gemini, OpenAI, Local)     │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **.NET** | 10.0 | Runtime |
| **ASP.NET Core** | 10.0 | Web API framework |
| **Microsoft Semantic Kernel** | 1.77.0 | LLM orchestration & agent framework |
| **SK Agents.Core** | 1.77.0 | ChatCompletionAgent, AgentGroupChat |
| **SK Connectors.Google** | 1.77.0-alpha | Gemini integration |
| **SK Connectors.OpenAI** | 1.77.0 | OpenAI / Ollama integration |
| **LiteDB** | 5.0.21 | Embedded NoSQL (dev / offline) |
| **MongoDB.Driver** | 3.9.0 | Production-grade NoSQL |
| **OpenAI SDK** | 2.11.0 | Direct OpenAI client |
| **Google GenerativeAI** | 3.6.6 | Gemini direct client |
| **Anthropic SDK** | 5.10.0 | Claude support |
| **Microsoft.AspNetCore.OpenApi** | 10.0 | OpenAPI / Swagger |

---

## 3. Clean Architecture Layers

AstraCore strictly follows Clean Architecture with inward-only dependency direction:

```
┌───────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   (Controllers, Filters, DTOs mapping)                │
│   → depends on Application layer only                 │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│                   Application Layer                    │
│   (Services, Commands, Business Logic)                │
│   → depends on Core layer only                        │
└───────────────────────┬───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│                   Core / Domain Layer                  │
│   (Entities, Repository Interfaces, Exceptions)       │
│   → zero external dependencies                        │
└───────────────────────┬───────────────────────────────┘
                        │ (implements interfaces)
┌───────────────────────▼───────────────────────────────┐
│                 Infrastructure Layer                   │
│   (LiteDbStore, MongoDbStore, AI Providers)           │
│   → implements Core interfaces only                   │
└───────────────────────────────────────────────────────┘
```

**Key Principle**: Core and Application layers never import infrastructure packages. Infrastructure implements interfaces defined in Core.

---

## 4. Project Structure

```
coreapi/
├── Program.cs                   # DI container setup, middleware pipeline, startup
├── appsettings.json             # Configuration (DB provider, connection strings)
├── appsettings.Development.json # Dev overrides
├── coreapi.csproj               # Package references (NuGet)
│
├── Core/                        # Domain Layer — zero external deps
│   ├── Entities/
│   │   ├── Models.cs            # All domain entities (Subsidiary, Agent, Task, etc.)
│   │   ├── IEntity.cs           # Base entity interface { Id: string }
│   │   ├── ChatRequest.cs       # Chat request/response DTOs
│   │   └── ChatResponse.cs
│   ├── Repositories/
│   │   └── IRepository.cs       # Generic IRepository<T> interface
│   └── Exceptions/
│       └── (domain exceptions)
│
├── Application/                 # Business Logic Layer
│   ├── DTOs/                    # Data transfer objects
│   ├── Interfaces/              # Additional service interfaces
│   ├── Commands/                # NLP director command system
│   │   ├── ICommandHandler.cs   # Command handler interface
│   │   ├── CommandResult.cs     # Command execution result
│   │   ├── DirectorCommandExecutor.cs  # Command dispatcher
│   │   └── Handlers/            # Concrete command handlers
│   │       ├── CreateSubsidiaryCommandHandler.cs
│   │       ├── HireAgentCommandHandler.cs
│   │       ├── AllocateFundsCommandHandler.cs
│   │       ├── AssignTaskCommandHandler.cs
│   │       └── StatusCommandHandler.cs
│   └── Services/
│       ├── Interfaces/          # Service interfaces (IAgentService, etc.)
│       ├── GroupChatService.cs  # Multi-agent hierarchical chat
│       ├── SemanticAgentService.cs  # Single-agent SK task execution
│       └── Implementations/     # Concrete service implementations
│           ├── AgentService.cs
│           ├── SubsidiaryService.cs
│           ├── TaskService.cs
│           ├── TaskProcessorService.cs  # LLM-powered task execution
│           ├── SimulationEngine.cs      # Core tick-loop simulation
│           ├── TransactionService.cs
│           ├── LeadService.cs
│           ├── EmployeeService.cs
│           ├── LogService.cs
│           └── DocumentParserHelper.cs  # Catalog file parsing
│
├── Infrastructure/              # Infrastructure Layer
│   ├── Persistence/
│   │   ├── IDocumentStore.cs    # Persistence abstraction interface
│   │   ├── LiteDbStore.cs       # LiteDB implementation
│   │   ├── MongoDbStore.cs      # MongoDB implementation
│   │   └── DocumentRepository.cs  # Generic IRepository<T> implementation
│   └── AI/
│       ├── IKernelProviderService.cs
│       ├── KernelProviderService.cs   # SK Kernel factory
│       ├── Providers/
│       │   ├── IModelProvider.cs      # Provider strategy interface
│       │   ├── GeminiProvider.cs      # Google Gemini
│       │   ├── OpenAIProvider.cs      # OpenAI + compatible APIs
│       │   └── LocalLlmProvider.cs   # Ollama / local LLMs
│       └── Plugins/                   # SK Plugins (tool definitions)
│
└── Presentation/                # HTTP Layer
    ├── Filters/
    │   └── ApiExceptionFilter.cs  # Global exception → JSON error response
    └── Controllers/
        ├── SimulationController.cs    # Core simulation endpoints
        ├── AgentController.cs
        ├── AgentChatController.cs
        ├── TaskController.cs
        ├── SubsidiaryController.cs
        ├── LeadsController.cs
        ├── EmployeesController.cs
        ├── CatalogController.cs
        ├── RoleBlueprintController.cs
        ├── TransactionService.cs (via SimulationController)
        ├── ConfigController.cs
        └── LogController.cs
```

---

## 5. Layer-by-Layer Deep Dive

### 5.1 Core Layer

The **Core layer** is the innermost ring — it has **zero dependencies** on external libraries. It defines:

**Entities** (`Models.cs`): All business objects as C# records/classes.
**`IEntity`**: Forces every entity to have a `string Id` property.
**`IRepository<T>`**: The generic persistence contract — `GetByIdAsync`, `GetAllAsync`, `SaveAsync`, `DeleteAsync`.

```csharp
// Core/Repositories/IRepository.cs
public interface IRepository<T> where T : IEntity
{
    Task<T?> GetByIdAsync(string id);
    Task<IEnumerable<T>> GetAllAsync();
    Task SaveAsync(T entity);
    Task DeleteAsync(string id);
}
```

### 5.2 Application Layer

Business logic lives here. Services depend only on `IRepository<T>` and other service interfaces from Core.

**Service Pattern**:
```csharp
public class AgentService : IAgentService
{
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    // injected via constructor
}
```

**Command Pattern** (for NLP director commands):
```csharp
public interface ICommandHandler
{
    bool CanHandle(string command);
    Task<CommandResult> ExecuteAsync(string command);
}
```

### 5.3 Infrastructure Layer

Implements Core interfaces. Contains:
- **LiteDbStore / MongoDbStore**: Both implement `IDocumentStore`, swapped at startup via config.
- **AI Providers**: Each implements `IModelProvider` with `CanHandle(modelId)` + `ConfigureKernel()`.

### 5.4 Presentation Layer

Thin HTTP layer. Controllers:
- Parse HTTP requests into DTOs
- Call Application services
- Return JSON responses
- **Never contain business logic**

```csharp
[ApiController]
[Route("api/[controller]")]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;
    // ...
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        var task = await _taskService.CreateAsync(dto);
        return Ok(task);
    }
}
```

---

## 6. Domain Model

```
                        ┌──────────────────┐
                        │     Subsidiary   │
                        │  id, name,       │
                        │  industry,       │
                        │  investment,     │
                        │  balance,        │
                        │  profits, ...    │
                        └────────┬─────────┘
                                 │ 1
                                 │
                 ┌───────────────┼────────────────┐
                 │               │                │
                 │ n             │ n              │ n
    ┌────────────▼──────┐ ┌─────▼──────┐ ┌──────▼──────────┐
    │      Agent         │ │  TaskItem  │ │   Employee      │
    │  id, name, role    │ │  id,title  │ │  id, name,      │
    │  instructions      │ │  status    │ │  designation    │
    │  modelId           │ │  progress  │ │  department     │
    │  status            │ │  logs[]    │ │  salary         │
    │  level, efficiency │ │  output    │ │  reportsToId    │
    │  conversationHist[]│ │  pendingQ  │ └─────────────────┘
    │  roleDefinition    │ └────────────┘
    └────────────────────┘

    ┌────────────────────┐ ┌────────────┐ ┌─────────────────┐
    │    Transaction     │ │    Lead    │ │   CatalogItem   │
    │  type, subtotal    │ │  stage,    │ │  productName    │
    │  cgst, sgst        │ │  source,   │ │  price, sku     │
    │  totalAmount       │ │  followUps │ │  category       │
    │  referenceNum      │ │  assignedTo│ └─────────────────┘
    │  partnerName       │ └────────────┘
    │  documentUrl       │
    └────────────────────┘

    ┌────────────────────┐ ┌────────────┐
    │   RoleBlueprint    │ │ActivityLog │
    │  name, skills[]    │ │  timestamp │
    │  temperature       │ │  message   │
    │  maxTokens         │ │  type      │
    │  outputFormat      │ │  agentName │
    │  memoryType        │ └────────────┘
    │  tools[]           │
    └────────────────────┘
```

### Entity Summary

| Entity | Collection | Key Fields |
|---|---|---|
| `AppConfig` | `configs` | `theme`, `tickSpeedMs`, `systemName` |
| `Subsidiary` | `subsidiaries` | `investment`, `balance`, `profits`, `expenses` |
| `Agent` | `agents` | `role`, `modelId`, `status`, `conversationHistory` |
| `TaskItem` | `tasks` | `status`, `progress`, `logs`, `output`, `pendingQuestion` |
| `ActivityLog` | `logs` | `timestamp`, `message`, `type`, `agentName` |
| `Transaction` | `transactions` | `type`, `totalAmount`, `cgst`, `sgst`, `documentUrl` |
| `Lead` | `leads` | `stage`, `source`, `estimatedValue`, `followUps` |
| `Employee` | `employees` | `designation`, `department`, `reportsToId` |
| `CatalogItem` | `catalog_items` | `productName`, `price`, `sku`, `category` |
| `RoleBlueprint` | `role_blueprints` | `temperature`, `maxTokens`, `outputFormat`, `tools` |

---

## 7. Dependency Injection & Service Registration

All services are registered in `Program.cs` as **Singletons**:

```csharp
// ── Database provider (config-driven) ──────────────────────
var dbProvider = config["DatabaseSettings:Provider"] ?? "LiteDB";
if (dbProvider == "MongoDB")
    services.AddSingleton<IDocumentStore, MongoDbStore>();
else
    services.AddSingleton<IDocumentStore, LiteDbStore>();

// ── Generic Repositories ──────────────────────────────────
services.AddSingleton<IRepository<Subsidiary>>(sp =>
    new DocumentRepository<Subsidiary>(sp.GetRequiredService<IDocumentStore>(), "subsidiaries"));
// ... (10 repositories total, one per collection)

// ── Application Services ──────────────────────────────────
services.AddSingleton<ILogService, LogService>();
services.AddSingleton<ISubsidiaryService, SubsidiaryService>();
services.AddSingleton<IAgentService, AgentService>();
services.AddSingleton<ITaskService, TaskService>();
services.AddSingleton<ITransactionService, TransactionService>();
services.AddSingleton<ILeadService, LeadService>();
services.AddSingleton<IEmployeeService, EmployeeService>();
services.AddSingleton<ISimulationEngine, SimulationEngine>();
services.AddSingleton<ITaskProcessorService, TaskProcessorService>();

// ── NLP Command Handlers ──────────────────────────────────
services.AddSingleton<ICommandHandler, CreateSubsidiaryCommandHandler>();
services.AddSingleton<ICommandHandler, HireAgentCommandHandler>();
services.AddSingleton<ICommandHandler, AllocateFundsCommandHandler>();
services.AddSingleton<ICommandHandler, AssignTaskCommandHandler>();
services.AddSingleton<ICommandHandler, StatusCommandHandler>();
services.AddSingleton<DirectorCommandExecutor>();

// ── AI Services ──────────────────────────────────────────
services.AddSingleton<IModelProvider, OpenAIProvider>();
services.AddSingleton<IModelProvider, GeminiProvider>();
services.AddSingleton<IModelProvider, LocalLlmProvider>();
services.AddSingleton<IKernelProviderService, KernelProviderService>();
services.AddSingleton<SemanticAgentService>();
services.AddSingleton<GroupChatService>();
```

### Service Dependency Graph

```
SimulationController
       │
       ▼
ISimulationEngine (SimulationEngine)
       │
       ├─► IRepository<Subsidiary>
       ├─► IRepository<Agent>
       ├─► IRepository<TaskItem>
       ├─► IRepository<ActivityLog>
       ├─► IRepository<CatalogItem>
       ├─► IRepository<RoleBlueprint>
       ├─► ILogService
       ├─► ITransactionService
       ├─► ILeadService
       └─► IEmployeeService

TaskController / SimulationController
       │
       ▼
ITaskProcessorService (TaskProcessorService)
       │
       ├─► IRepository<TaskItem>
       ├─► IRepository<Agent>
       ├─► IKernelProviderService ──► IModelProvider[]
       └─► ILogService
```

---

## 8. API Endpoints Reference

### SimulationController (`/api/simulation`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/simulation/state` | Returns full SimulationState snapshot |
| POST | `/api/simulation/tick` | Advances simulation by one step |
| POST | `/api/simulation/reset` | Resets all state to defaults |
| POST | `/api/simulation/subsidiary` | Creates a new subsidiary |
| POST | `/api/simulation/agent` | Hires a new agent |
| POST | `/api/simulation/task` | Creates a new task |
| POST | `/api/simulation/task/assign` | Assigns agent to task |
| POST | `/api/simulation/start-task` | Triggers LLM task execution |
| POST | `/api/simulation/task/{id}/answer` | Answers a pending agent question |
| POST | `/api/simulation/allocate-funds` | Allocates funds to subsidiary |
| POST | `/api/simulation/clear-logs` | Clears activity logs |
| POST | `/api/simulation/command` | NLP director command parse & execute |
| GET | `/api/simulation/roles` | List all role blueprints |
| POST | `/api/simulation/roles` | Create/seed role blueprint |
| POST | `/api/simulation/transaction` | Create manual transaction |

### Dedicated Controllers

| Method | Path | Description |
|---|---|---|
| GET | `/api/leads` | List all leads |
| POST | `/api/leads` | Create new lead |
| PUT | `/api/leads/{id}/stage` | Update lead pipeline stage |
| DELETE | `/api/leads/{id}` | Delete lead |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Add employee |
| DELETE | `/api/employees/{id}` | Remove employee |
| GET | `/api/catalog` | List catalog items |
| POST | `/api/catalog` | Add single catalog item |
| POST | `/api/catalog/upload` | Upload file (Excel/CSV/image) |
| POST | `/api/catalog/clear` | Clear all catalog items |
| POST | `/api/chat` | Chat with specific agent |
| GET | `/api/config` | Get app configuration |
| PUT | `/api/config` | Update app configuration |

---

## 9. AI Integration Architecture

### Model Provider Pattern (Strategy)

```
IModelProvider (interface)
├── bool CanHandle(string modelId)
└── void ConfigureKernel(IKernelBuilder builder, string modelId)

Implementations:
├── GeminiProvider     → modelId starts with "gemini-"
├── OpenAIProvider     → modelId starts with "gpt-" or "o1-"
└── LocalLlmProvider  → modelId = "gemma4:latest", "llama-*", etc.
```

### KernelProviderService (Factory)

```csharp
public Kernel CreateKernel(string modelId, string subsidiaryId)
{
    var builder = Kernel.CreateBuilder();
    var provider = _providers.First(p => p.CanHandle(modelId));
    provider.ConfigureKernel(builder, modelId);
    return builder.Build();
}
```

### AI Flow Diagram

```
User requests task execution
       │
       ▼
TaskProcessorService.ProcessTaskAsync(taskId)
       │
       ▼
KernelProviderService.CreateKernel(agent.ModelId)
       │
       ├─► modelId = "gemini-2.0-flash"
       │         └─► GeminiProvider.ConfigureKernel()
       │                  └─► AddGoogleAIGeminiChatCompletion()
       │
       ├─► modelId = "gpt-4o"
       │         └─► OpenAIProvider.ConfigureKernel()
       │                  └─► AddOpenAIChatCompletion()
       │
       └─► modelId = "gemma4:latest"
                 └─► LocalLlmProvider.ConfigureKernel()
                          └─► AddOpenAIChatCompletion(
                                endpoint: "http://localhost:11434"
                              )

Kernel created
       │
       ▼
ChatCompletionAgent {
    Name: agent.Name,
    Instructions: agent.Role + agent.Instructions,
    Kernel: kernel
}
       │
       ▼
agent.InvokeAsync(chatHistory)
       │
       ▼
LLM generates streamed response
       │
       ▼
Task.Output saved → Status = "completed"
```

### Multi-Agent Group Chat (GroupChatService)

```
User sends message to primary agent
       │
       ▼
GroupChatService.RunHierarchicalChatAsync(primaryAgentId, message)
       │
       ▼
Load primary agent + all subsidiary peers
       │
       ▼
Create SK ChatCompletionAgent for each:
  Primary: "You are {name}. Talk to the user. Ask peers if needed."
  Peers:   "You are {name}. Only respond if {primary} asks you."
       │
       ▼
AgentGroupChat with SelectionStrategy:
  - KernelFunctionTerminationStrategy (max 6 turns or TERMINATE token)
  - KernelFunctionSelectionStrategy (smart agent turn selection)
       │
       ▼
Chat runs → messages collected → returned as ResultMessageDto[]
```

### SemanticAgentService (Single Agent Mode)

```csharp
// Used for /api/test-agent quick testing
public async Task<ChatResponse> ExecuteAgentTaskAsync(ChatRequest request)
{
    var kernel = _kernelProvider.CreateKernel(request.ModelId, "default");
    var agent = new ChatCompletionAgent { Instructions = request.Instructions, Kernel = kernel };
    var chatHistory = new ChatHistory(request.SystemPrompt);
    chatHistory.AddUserMessage(request.UserMessage);
    // stream and collect response...
}
```

---

## 10. Persistence Layer

### Dual-Database Strategy

```
appsettings.json:
  "DatabaseSettings": { "Provider": "LiteDB" }
                    or { "Provider": "MongoDB" }
                                │
                                ▼
                        IDocumentStore
                    (abstraction interface)
                       /            \
              LiteDbStore        MongoDbStore
                  │                   │
             astracore.db         MongoDB Atlas
            (local file)          (remote cluster)
```

### IDocumentStore Interface

```csharp
public interface IDocumentStore
{
    Task<T?> GetAsync<T>(string collectionName, string id);
    Task SaveAsync<T>(string collectionName, string id, T document);
    Task<IEnumerable<T>> GetAllAsync<T>(string collectionName);
    Task DeleteAsync(string collectionName, string id);
}
```

### DocumentRepository (Generic)

```csharp
// Bridges IRepository<T> (Core) to IDocumentStore (Infrastructure)
public class DocumentRepository<T> : IRepository<T> where T : IEntity
{
    private readonly IDocumentStore _store;
    private readonly string _collectionName;

    public Task<T?> GetByIdAsync(string id) => _store.GetAsync<T>(_collectionName, id);
    public Task SaveAsync(T entity) => _store.SaveAsync(_collectionName, entity.Id, entity);
    // ...
}
```

### Collection Mapping

| Entity Type | Collection Name |
|---|---|
| `Subsidiary` | `subsidiaries` |
| `Agent` | `agents` |
| `TaskItem` | `tasks` |
| `ActivityLog` | `logs` |
| `AppConfig` | `configs` |
| `Transaction` | `transactions` |
| `Lead` | `leads` |
| `Employee` | `employees` |
| `CatalogItem` | `catalog_items` |
| `RoleBlueprint` | `role_blueprints` |

### LiteDB Details

- File location: `{AppContext.BaseDirectory}/data/astracore.db`
- Connection: Per-operation (no connection pooling — embedded engine)
- Upsert pattern: `col.Upsert(id, document)`

### MongoDB Details

- Connection: Via `MongoDbStore` using `IConfiguration["DatabaseSettings:ConnectionString"]`
- Uses `ReplaceOneAsync` with `upsert: true`
- All collections in a single database named `astracore`

---

## 11. Simulation Engine

The `SimulationEngine` is the core of AstraCore's autonomous behavior. It drives agent work, transactions, and logs on every tick call.

### Tick Execution Flow

```
POST /api/simulation/tick
       │
       ▼
SimulationEngine.TickAsync()
       │
       ├─── 1. Process each active agent
       │         │
       │         └─► Agent.Status == "working"
       │               │
       │               └─► Random agent thought logged
       │               └─► Progress incremented
       │               └─► If task assigned → task.Progress++
       │               └─► If task complete → finalize (profit, log)
       │
       ├─── 2. Emit periodic auto-transactions
       │         │
       │         └─► Random expense/procurement for active subsidiaries
       │
       ├─── 3. Update agent idle/resting cycle
       │         │
       │         └─► idle→thinking→working→resting→idle rotation
       │
       └─── 4. Return full SimulationState snapshot
                 (all collections aggregated)
```

### Agent Status State Machine

```
    ┌─────────┐
    │  idle   │◄────────────────────────────┐
    └────┬────┘                             │
         │ tick                             │ reset/rest ends
    ┌────▼────────┐                    ┌────┴────┐
    │  thinking   │                    │ resting │
    └────┬────────┘                    └─────────┘
         │ tick                             ▲
    ┌────▼────┐                             │
    │ working │─────────────────────────────┘
    └─────────┘  task complete/rest cycle
```

### Agent Thought System

Each role has domain-specific "thoughts" — log messages that simulate cognitive activity:

```csharp
private static readonly Dictionary<string, List<string>> AGENT_THOUGHTS = new() {
    { "CEO",       new() { "Refining organizational roadmap...", ... } },
    { "CFO",       new() { "Balancing the ledger...", ... } },
    { "Developer", new() { "Refactoring API route handlers...", ... } },
    // ...
};
```

---

## 12. NLP Command System

The `DirectorCommandExecutor` pattern-matches natural language commands to typed handlers:

```
"Hire a Developer named Alice for TechCore"
       │
       ▼
DirectorCommandExecutor.ExecuteAsync(command)
       │
       ▼
Iterates ICommandHandler[] (registered via DI)
       │
       ├─► CreateSubsidiaryCommandHandler.CanHandle() → false
       ├─► HireAgentCommandHandler.CanHandle() → TRUE
       │         └─► Parses: role=Developer, name=Alice, subsidiary=TechCore
       │         └─► agentService.CreateAsync(agentData)
       │         └─► Returns CommandResult.Success("Alice hired!")
       │
       └─► Returns result to controller → JSON response
```

### Command Handlers

| Handler | Triggers | Action |
|---|---|---|
| `CreateSubsidiaryCommandHandler` | "create subsidiary", "new subsidiary" | Creates a subsidiary |
| `HireAgentCommandHandler` | "hire", "recruit", "add agent" | Creates an agent |
| `AllocateFundsCommandHandler` | "allocate", "fund", "invest" | Adds funds to subsidiary |
| `AssignTaskCommandHandler` | "assign", "give task" | Assigns task to agent |
| `StatusCommandHandler` | "status", "report", "show" | Returns current state summary |

---

## 13. Key Workflows

### A. Simulation Tick Cycle

```
Frontend (every 2000ms)
       │
       ▼
POST /api/simulation/tick
       │
       ▼
SimulationEngine.TickAsync()
       │
       ├─ Agents advance work (progress++)
       ├─ Completed tasks generate logs + possibly transactions
       ├─ Auto-expense events
       └─ Returns SimulationState
       │
       ▼
Frontend dispatches setters to all Redux slices
       │
       ▼
UI re-renders with live data
```

### B. LLM Task Execution

```
POST /api/simulation/start-task { taskId }
       │
       ▼
TaskController → TaskProcessorService.ProcessTaskAsync(taskId)
       │
       ▼
Load task + assigned agent from repository
       │
       ▼
KernelProviderService.CreateKernel(agent.ModelId)
       │
       ▼
Create ChatCompletionAgent with agent's instructions
       │
       ▼
LLM streams response (async foreach)
       │
       ├─ Accumulate output text
       └─ Watch for "ASK_QUESTION:" prefix → set pendingQuestion
       │
       ▼
Update task: Output = result, Status = "completed"
       │
       ▼
Log activity + adjust agent status to "resting"
```

### C. Catalog File Upload

```
POST /api/catalog/upload (multipart/form-data)
       │
       ▼
CatalogController.UploadCatalog(IFormFile file)
       │
       ▼
DocumentParserHelper.ParseAsync(file)
       │
       ├─► .xlsx / .xls → parse Excel rows → CatalogItem[]
       ├─► .csv         → parse CSV lines → CatalogItem[]
       └─► image        → OCR via AI provider → CatalogItem[]
       │
       ▼
Each item saved via IRepository<CatalogItem>
       │
       ▼
Return count of imported items
```

### D. Role Blueprint Seeding

```
Program.cs (startup)
       │
       ▼
AgentService.EnsureRolesSeededAsync()
       │
       ▼
IRepository<RoleBlueprint>.GetAllAsync()
       │
       ├─ If empty → seed 50+ predefined blueprints
       │             (CEO, CFO, CTO, CMO, Developer, Designer,
       │              Content Creator, Supervisor, QA, etc.)
       └─ If has data → skip (idempotent)
```

---

## 14. Configuration & Secrets

### appsettings.json

```json
{
  "DatabaseSettings": {
    "Provider": "LiteDB",
    "ConnectionString": "mongodb://localhost:27017"
  },
  "GEMINI_API_KEY": ""
}
```

### Environment Variables

| Variable | Usage |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API authentication |
| `OPENAI_API_KEY` | OpenAI API authentication (set externally) |

### CORS Policy

Configured in `Program.cs` to allow:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- Credentials, any header, any method

### Startup Middleware Pipeline

```
request
  │
  ├─► CORS (AllowFrontend policy)
  ├─► HTTPS Redirection
  ├─► Authorization
  ├─► OpenAPI (dev only)
  ├─► ApiExceptionFilter (global error handling)
  └─► Controllers (route matching)
```

---

## Development Quick Reference

```bash
# Build
dotnet build

# Run (dev mode, port 5035)
dotnet run

# Run with hot reload
dotnet watch run

# View OpenAPI spec
# Navigate to: http://localhost:5035/openapi/v1.json
```

### Changing Database Provider

Edit `appsettings.json`:
```json
{
  "DatabaseSettings": {
    "Provider": "MongoDB",
    "ConnectionString": "mongodb+srv://user:pass@cluster.mongodb.net"
  }
}
```

> **Note**: Frontend must be running on `http://localhost:5173`. See `../FRONTEND_ARCHITECTURE.md`.
