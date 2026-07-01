using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Infrastructure.Persistence;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.Services.Implementations;
using CoreApi.Application.Commands;
using CoreApi.Application.Commands.Handlers;
using CoreApi.Presentation.Filters;
using System;
using coreapi.Application.Services;
using coreapi.Infrastructure.AI;
using coreapi.Infrastructure.AI.Providers;
var builder = WebApplication.CreateBuilder(args);

var geminiKey = builder.Configuration.GetValue<string>("GEMINI_API_KEY");
if (!string.IsNullOrEmpty(geminiKey))
{
    Environment.SetEnvironmentVariable("GEMINI_API_KEY", geminiKey);
}

// Add controllers with global API exception handling filter
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiExceptionFilter>();
});

// Configure OpenAPI
builder.Services.AddOpenApi();

// Configure CORS for Vite dev server and common frontend URLs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Database Provider dynamically
var dbProvider = builder.Configuration.GetValue<string>("DatabaseSettings:Provider") ?? "LiteDB";
if (dbProvider.Equals("MongoDB", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IDocumentStore, MongoDbStore>();
}
else
{
    builder.Services.AddSingleton<IDocumentStore, LiteDbStore>();
}

// Register generic repositories using collection names
builder.Services.AddSingleton<IRepository<Subsidiary>>(sp => 
    new DocumentRepository<Subsidiary>(sp.GetRequiredService<IDocumentStore>(), "subsidiaries"));
builder.Services.AddSingleton<IRepository<Agent>>(sp => 
    new DocumentRepository<Agent>(sp.GetRequiredService<IDocumentStore>(), "agents"));
builder.Services.AddSingleton<IRepository<TaskItem>>(sp => 
    new DocumentRepository<TaskItem>(sp.GetRequiredService<IDocumentStore>(), "tasks"));
builder.Services.AddSingleton<IRepository<ActivityLog>>(sp => 
    new DocumentRepository<ActivityLog>(sp.GetRequiredService<IDocumentStore>(), "logs"));
builder.Services.AddSingleton<IRepository<AppConfig>>(sp => 
    new DocumentRepository<AppConfig>(sp.GetRequiredService<IDocumentStore>(), "configs"));
builder.Services.AddSingleton<IRepository<Transaction>>(sp => 
    new DocumentRepository<Transaction>(sp.GetRequiredService<IDocumentStore>(), "transactions"));
builder.Services.AddSingleton<IRepository<Lead>>(sp => 
    new DocumentRepository<Lead>(sp.GetRequiredService<IDocumentStore>(), "leads"));
builder.Services.AddSingleton<IRepository<Employee>>(sp => 
    new DocumentRepository<Employee>(sp.GetRequiredService<IDocumentStore>(), "employees"));
builder.Services.AddSingleton<IRepository<CatalogItem>>(sp => 
    new DocumentRepository<CatalogItem>(sp.GetRequiredService<IDocumentStore>(), "catalog_items"));
builder.Services.AddSingleton<IRepository<RoleBlueprint>>(sp => 
    new DocumentRepository<RoleBlueprint>(sp.GetRequiredService<IDocumentStore>(), "role_blueprints"));
builder.Services.AddSingleton<IRepository<HeartbeatLog>>(sp =>
    new DocumentRepository<HeartbeatLog>(sp.GetRequiredService<IDocumentStore>(), "heartbeat_logs"));
builder.Services.AddSingleton<IRepository<GroupChat>>(sp =>
    new DocumentRepository<GroupChat>(sp.GetRequiredService<IDocumentStore>(), "group_chats"));
builder.Services.AddSingleton<IRepository<GroupChatMessage>>(sp =>
    new DocumentRepository<GroupChatMessage>(sp.GetRequiredService<IDocumentStore>(), "group_chat_messages"));
builder.Services.AddSingleton<IRepository<MemoryEntry>>(sp =>
    new DocumentRepository<MemoryEntry>(sp.GetRequiredService<IDocumentStore>(), "memory_book"));

// Register application services
builder.Services.AddSingleton<ILogService, LogService>();
builder.Services.AddSingleton<ISubsidiaryService, SubsidiaryService>();
builder.Services.AddSingleton<IAgentService, AgentService>();
builder.Services.AddSingleton<ITaskService, TaskService>();
builder.Services.AddSingleton<ITransactionService, TransactionService>();
builder.Services.AddSingleton<ILeadService, LeadService>();
builder.Services.AddSingleton<IEmployeeService, EmployeeService>();
builder.Services.AddSingleton<ISimulationEngine, SimulationEngine>();
builder.Services.AddSingleton<ITaskProcessorService, TaskProcessorService>();
builder.Services.AddSingleton<IHeartbeatService, HeartbeatService>();
builder.Services.AddSingleton<ITeamChatManagerService, TeamChatManagerService>();
builder.Services.AddSingleton<IMemoryBookService, MemoryBookService>();

// Autonomous heartbeat background worker (IHostedService)
builder.Services.AddHostedService<AgentHeartbeatWorker>();

// Register NLP Command Handlers
builder.Services.AddSingleton<ICommandHandler, CreateSubsidiaryCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, HireAgentCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, AllocateFundsCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, AssignTaskCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, StatusCommandHandler>();
builder.Services.AddSingleton<DirectorCommandExecutor>();

// Register AI Semantic Services
builder.Services.AddSingleton<IModelProvider, OpenAIProvider>();
builder.Services.AddSingleton<IModelProvider, GeminiProvider>();
builder.Services.AddSingleton<IModelProvider, LocalLlmProvider>();
builder.Services.AddSingleton<IKernelProviderService, KernelProviderService>();
builder.Services.AddSingleton<SemanticAgentService>();
builder.Services.AddSingleton<GroupChatService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapPost("/api/test-agent", async (coreapi.Core.Entities.ChatRequest request, SemanticAgentService service) =>
{
    try
    {
        var response = await service.ExecuteAgentTaskAsync(request);
        return Results.Ok(response);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex.Message);
    }
});


// Map any broken gemma:latest references to the actual installed gemma4:latest model
using (var scope = app.Services.CreateScope())
{
    var agentService = scope.ServiceProvider.GetRequiredService<IAgentService>();
    var agents = await agentService.GetAllAsync();
    foreach (var agent in agents)
    {
        if (agent.ModelId == "gemma:latest" || agent.ModelId == "llama-3.3-70b")
        {
            agent.ModelId = "gemma4:latest";
            await agentService.SaveAsync(agent);
        }
    }
}

app.Run();
