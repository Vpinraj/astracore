using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Infrastructure.Persistence;
using CoreApi.Application.Services.Interfaces;
using CoreApi.Application.Services.Implementations;
using CoreApi.Application.Commands;
using CoreApi.Application.Commands.Handlers;
using CoreApi.Presentation.Filters;
using System;

var builder = WebApplication.CreateBuilder(args);

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

// Register application services
builder.Services.AddSingleton<ILogService, LogService>();
builder.Services.AddSingleton<ISubsidiaryService, SubsidiaryService>();
builder.Services.AddSingleton<IAgentService, AgentService>();
builder.Services.AddSingleton<ITaskService, TaskService>();
builder.Services.AddSingleton<ITransactionService, TransactionService>();
builder.Services.AddSingleton<ILeadService, LeadService>();
builder.Services.AddSingleton<IEmployeeService, EmployeeService>();
builder.Services.AddSingleton<ISimulationEngine, SimulationEngine>();

// Register NLP Command Handlers
builder.Services.AddSingleton<ICommandHandler, CreateSubsidiaryCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, HireAgentCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, AllocateFundsCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, AssignTaskCommandHandler>();
builder.Services.AddSingleton<ICommandHandler, StatusCommandHandler>();
builder.Services.AddSingleton<DirectorCommandExecutor>();

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

app.Run();
