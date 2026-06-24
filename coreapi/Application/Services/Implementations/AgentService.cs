using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Exceptions;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class AgentService : IAgentService
{
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;

    private static readonly List<AgentRoleDefinition> BLUEPRINTS = new()
    {
        new AgentRoleDefinition
        {
            Name = "CEO",
            CommonSkills = new() { "Strategic Planning", "Leadership", "Decision Making", "Stakeholder Management", "Vision Setting" },
            Temperature = 0.5, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "long_term",
            Tools = new()
            {
                new AgentTool { Name = "read_reports", Description = "Read financial and operational reports", Enabled = true },
                new AgentTool { Name = "send_directive", Description = "Issue directives to subordinate agents", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search the web for market intelligence", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "CFO",
            CommonSkills = new() { "Financial Analysis", "Budget Allocation", "Risk Assessment", "Cost Optimization", "Forecasting" },
            Temperature = 0.2, MaxTokens = 1024, OutputFormat = "json", MemoryType = "long_term",
            Tools = new()
            {
                new AgentTool { Name = "read_ledger", Description = "Access the subsidiary financial ledger", Enabled = true },
                new AgentTool { Name = "generate_report", Description = "Generate formatted financial reports", Enabled = true },
                new AgentTool { Name = "alert_ceo", Description = "Send budget alerts to the CEO", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "CTO",
            CommonSkills = new() { "System Architecture", "AI/ML Pipelines", "DevOps", "Code Review", "Tech Strategy" },
            Temperature = 0.3, MaxTokens = 4096, OutputFormat = "code", MemoryType = "short_term",
            Tools = new()
            {
                new AgentTool { Name = "code_exec", Description = "Execute code in a sandboxed runtime", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Read source files from the repository", Enabled = true },
                new AgentTool { Name = "deploy_service", Description = "Trigger CI/CD deployment pipeline", Enabled = false },
                new AgentTool { Name = "web_search", Description = "Search docs and Stack Overflow", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "CMO",
            CommonSkills = new() { "Brand Strategy", "Growth Marketing", "Campaign Management", "SEO/SEM", "Audience Analytics" },
            Temperature = 0.7, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "short_term",
            Tools = new()
            {
                new AgentTool { Name = "web_search", Description = "Research trends and competitor activity", Enabled = true },
                new AgentTool { Name = "generate_copy", Description = "Generate ad/content copy", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Send campaign emails", Enabled = false }
            }
        },
        new AgentRoleDefinition
        {
            Name = "Product Manager",
            CommonSkills = new() { "Roadmap Planning", "User Research", "Sprint Management", "Backlog Grooming", "OKR Setting" },
            Temperature = 0.5, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "long_term",
            Tools = new()
            {
                new AgentTool { Name = "read_backlog", Description = "Read and prioritize the task backlog", Enabled = true },
                new AgentTool { Name = "write_spec", Description = "Write user story or feature specification", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Research competitors and user feedback", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "Developer",
            CommonSkills = new() { "Full-Stack Development", "API Design", "Unit Testing", "CI/CD", "Database Optimization" },
            Temperature = 0.2, MaxTokens = 8192, OutputFormat = "code", MemoryType = "short_term",
            Tools = new()
            {
                new AgentTool { Name = "code_exec", Description = "Execute code in a sandboxed runtime", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Read files from the project repository", Enabled = true },
                new AgentTool { Name = "write_file", Description = "Write or patch source files", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search documentation and GitHub issues", Enabled = true },
                new AgentTool { Name = "run_tests", Description = "Run automated test suites", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "UI Designer",
            CommonSkills = new() { "UI/UX Design", "Figma Prototyping", "Design Systems", "Accessibility", "Animation" },
            Temperature = 0.9, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "none",
            Tools = new()
            {
                new AgentTool { Name = "generate_image", Description = "Generate UI mockup images via AI", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search design inspiration and libraries", Enabled = true },
                new AgentTool { Name = "write_file", Description = "Write CSS / component files", Enabled = false }
            }
        },
        new AgentRoleDefinition
        {
            Name = "Marketer",
            CommonSkills = new() { "Content Creation", "Social Media", "Email Campaigns", "Copywriting", "A/B Testing" },
            Temperature = 0.8, MaxTokens = 1024, OutputFormat = "plain", MemoryType = "none",
            Tools = new()
            {
                new AgentTool { Name = "generate_copy", Description = "Write marketing copy", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Research trends and keywords", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Send newsletter or campaign emails", Enabled = false }
            }
        },
        new AgentRoleDefinition
        {
            Name = "QA Engineer",
            CommonSkills = new() { "Test Automation", "Regression Testing", "Bug Reporting", "Performance Testing", "API Testing" },
            Temperature = 0.1, MaxTokens = 4096, OutputFormat = "json", MemoryType = "short_term",
            Tools = new()
            {
                new AgentTool { Name = "run_tests", Description = "Execute automated test suites", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Inspect source code for issues", Enabled = true },
                new AgentTool { Name = "file_bug", Description = "File a bug report in the tracker", Enabled = true },
                new AgentTool { Name = "code_exec", Description = "Run scripts for performance profiling", Enabled = true }
            }
        },
        new AgentRoleDefinition
        {
            Name = "Customer Support",
            CommonSkills = new() { "Ticket Resolution", "Knowledge Base", "SLA Management", "Customer Empathy", "Escalation Handling" },
            Temperature = 0.4, MaxTokens = 512, OutputFormat = "plain", MemoryType = "short_term",
            Tools = new()
            {
                new AgentTool { Name = "read_kb", Description = "Read knowledge base articles", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Reply to customer tickets via email", Enabled = true },
                new AgentTool { Name = "escalate", Description = "Escalate unresolved tickets to a human", Enabled = true }
            }
        }
    };

    public AgentService(
        IRepository<Agent> agentRepository, 
        IRepository<Subsidiary> subsidiaryRepository, 
        ILogService logService,
        ITransactionService transactionService)
    {
        _agentRepository = agentRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
        _transactionService = transactionService;
    }

    public async Task<Agent> HireAgentAsync(string name, string role, string subsidiaryId, string? instructions = null, string? modelId = null, AgentRoleDefinition? customOverrides = null)
    {
        var subsidiary = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        if (subsidiary == null)
        {
            throw new EntityNotFoundException(nameof(Subsidiary), subsidiaryId);
        }

        var blueprint = BLUEPRINTS.FirstOrDefault(b => b.Name.Equals(role, StringComparison.OrdinalIgnoreCase));
        if (blueprint == null)
        {
            // Default generic blueprint
            blueprint = new AgentRoleDefinition
            {
                Name = role,
                CommonSkills = new() { "General AI Capabilities", "Task Execution", "Reporting" },
                Temperature = 0.2, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "short_term"
            };
        }

        // Apply overrides if any
        var roleDef = new AgentRoleDefinition
        {
            Name = blueprint.Name,
            CommonSkills = new List<string>(blueprint.CommonSkills),
            Temperature = customOverrides?.Temperature ?? blueprint.Temperature,
            MaxTokens = customOverrides?.MaxTokens != 0 ? (customOverrides?.MaxTokens ?? blueprint.MaxTokens) : blueprint.MaxTokens,
            OutputFormat = !string.IsNullOrEmpty(customOverrides?.OutputFormat) ? customOverrides.OutputFormat : blueprint.OutputFormat,
            MemoryType = !string.IsNullOrEmpty(customOverrides?.MemoryType) ? customOverrides.MemoryType : blueprint.MemoryType,
            Tools = customOverrides?.Tools != null && customOverrides.Tools.Any() ? customOverrides.Tools : blueprint.Tools.Select(t => new AgentTool { Name = t.Name, Description = t.Description, Enabled = t.Enabled }).ToList()
        };

        var finalInstructions = string.IsNullOrWhiteSpace(instructions)
            ? $"You are {name}, an AI agent with the role of {role}. Your core skills include {string.Join(", ", roleDef.CommonSkills.Take(3))}. Execute all assigned tasks with precision and report your progress."
            : instructions.Trim();

        var avatarMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Developer", "👨‍💻" }, { "CTO", "👨‍💻" }, { "UI Designer", "🎨" },
            { "CEO", "👩‍💼" }, { "CFO", "👩‍💻" }, { "CMO", "📣" },
            { "Product Manager", "📋" }, { "Marketer", "📢" },
            { "QA Engineer", "🔬" }, { "Customer Support", "🎧" }
        };

        var avatar = avatarMap.TryGetValue(role, out var av) ? av : "🤖";

        var random = new Random();
        var efficiency = Math.Round(0.8 + random.NextDouble() * 0.6, 2);

        var agent = new Agent
        {
            Id = $"agent-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Name = name,
            Role = role,
            RoleDefinition = roleDef,
            Instructions = finalInstructions,
            ModelId = modelId ?? "gemma4:latest",
            SubsidiaryId = subsidiaryId,
            Status = "idle",
            Avatar = avatar,
            Level = 1,
            Efficiency = efficiency,
            ConversationHistory = new()
            {
                new ConversationMessage { Role = "system", Content = finalInstructions, Timestamp = DateTime.UtcNow.ToString("o") }
            }
        };

        await _agentRepository.SaveAsync(agent);

        await _logService.AddLogAsync(
            $"AI Agent \"{name}\" ({role}) deployed under {subsidiary.Name}. Model: {agent.ModelId}. Temp: {roleDef.Temperature}, Tools: {roleDef.Tools.Count(t => t.Enabled)} active.",
            "agent_action",
            subsidiaryName: subsidiary.Name,
            agentName: name
        );

        return agent;
    }

    public Task<IEnumerable<Agent>> GetAllAsync() => _agentRepository.GetAllAsync();
    public Task<Agent?> GetByIdAsync(string id) => _agentRepository.GetByIdAsync(id);
    public Task SaveAsync(Agent agent) => _agentRepository.SaveAsync(agent);
    public Task DeleteAsync(string id) => _agentRepository.DeleteAsync(id);
}
