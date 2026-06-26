using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Exceptions;
using CoreApi.Core.Repositories;
using CoreApi.Application.DTOs;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class AgentService : IAgentService
{
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;

    private readonly IRepository<RoleBlueprint> _roleBlueprintRepository;
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<HeartbeatLog> _heartbeatLogRepository;

    public AgentService(
        IRepository<Agent> agentRepository, 
        IRepository<Subsidiary> subsidiaryRepository, 
        ILogService logService,
        ITransactionService transactionService,
        IRepository<RoleBlueprint> roleBlueprintRepository,
        IRepository<TaskItem> taskRepository,
        IRepository<HeartbeatLog> heartbeatLogRepository)
    {
        _agentRepository = agentRepository;
        _subsidiaryRepository = subsidiaryRepository;
        _logService = logService;
        _transactionService = transactionService;
        _roleBlueprintRepository = roleBlueprintRepository;
        _taskRepository = taskRepository;
        _heartbeatLogRepository = heartbeatLogRepository;
    }

    public async Task EnsureRolesSeededAsync()
    {
        var existing = (await _roleBlueprintRepository.GetAllAsync()).ToList();
        var blueprints = GetPrefilledRoleBlueprints();

        if (!existing.Any())
        {
            foreach (var bp in blueprints)
            {
                await _roleBlueprintRepository.SaveAsync(bp);
            }
        }
        else
        {
            // Backfill missing heartbeat instructions on existing blueprints
            foreach (var bp in blueprints)
            {
                var existBp = existing.FirstOrDefault(e => string.Equals(e.Name, bp.Name, StringComparison.OrdinalIgnoreCase));
                if (existBp != null && string.IsNullOrWhiteSpace(existBp.HeartbeatInstruction) && !string.IsNullOrWhiteSpace(bp.HeartbeatInstruction))
                {
                    existBp.HeartbeatInstruction = bp.HeartbeatInstruction;
                    await _roleBlueprintRepository.SaveAsync(existBp);
                }
            }
        }
    }

    private static List<RoleBlueprint> GetPrefilledRoleBlueprints()
    {
        var list = new List<RoleBlueprint>();
        
        // 1. CEO
        list.Add(new RoleBlueprint {
            Id = "ceo", Name = "CEO",
            CommonSkills = new() { "Strategic Planning", "Leadership", "Decision Making", "Stakeholder Management", "Vision Setting" },
            Temperature = 0.5, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "long_term",
            HeartbeatInstruction = "Assess overall organisational health across all subsidiaries. Flag any critical decisions pending, summarise top 3 strategic priorities, and issue any necessary directives to subordinate agents.",
            Tools = new() {
                new AgentTool { Name = "read_reports", Description = "Read financial and operational reports", Enabled = true },
                new AgentTool { Name = "send_directive", Description = "Issue directives to subordinate agents", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search the web for market intelligence", Enabled = true }
            }
        });
        
        // 2. CFO
        list.Add(new RoleBlueprint {
            Id = "cfo", Name = "CFO",
            CommonSkills = new() { "Financial Analysis", "Budget Allocation", "Risk Assessment", "Cost Optimization", "Forecasting" },
            Temperature = 0.2, MaxTokens = 1024, OutputFormat = "json", MemoryType = "long_term",
            HeartbeatInstruction = "Review current financial positions across all subsidiaries. Flag any budget overruns or cash-flow risks. Generate a brief financial health snapshot in JSON format and alert the CEO of any critical anomalies.",
            Tools = new() {
                new AgentTool { Name = "read_ledger", Description = "Access the subsidiary financial ledger", Enabled = true },
                new AgentTool { Name = "generate_report", Description = "Generate formatted financial reports", Enabled = true },
                new AgentTool { Name = "alert_ceo", Description = "Send budget alerts to the CEO", Enabled = true }
            }
        });

        // 3. CTO
        list.Add(new RoleBlueprint {
            Id = "cto", Name = "CTO",
            CommonSkills = new() { "System Architecture", "AI/ML Pipelines", "DevOps", "Code Review", "Tech Strategy" },
            Temperature = 0.3, MaxTokens = 4096, OutputFormat = "code", MemoryType = "short_term",
            HeartbeatInstruction = "Scan for pending technical debt, infrastructure anomalies, and open deployment issues. Summarise current system health in code/markdown format and recommend one priority action for the next development cycle.",
            Tools = new() {
                new AgentTool { Name = "code_exec", Description = "Execute code in a sandboxed runtime", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Read source files from the repository", Enabled = true },
                new AgentTool { Name = "deploy_service", Description = "Trigger CI/CD deployment pipeline", Enabled = false },
                new AgentTool { Name = "web_search", Description = "Search docs and Stack Overflow", Enabled = true }
            }
        });

        // 4. CMO
        list.Add(new RoleBlueprint {
            Id = "cmo", Name = "CMO",
            CommonSkills = new() { "Brand Strategy", "Growth Marketing", "Campaign Management", "SEO/SEM", "Audience Analytics" },
            Temperature = 0.7, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "short_term",
            HeartbeatInstruction = "Review all active marketing campaigns and audience engagement metrics. Highlight the top-performing channel, identify one underperforming area, and propose a concrete growth action for the next cycle.",
            Tools = new() {
                new AgentTool { Name = "web_search", Description = "Research trends and competitor activity", Enabled = true },
                new AgentTool { Name = "generate_copy", Description = "Generate ad/content copy", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Send campaign emails", Enabled = false }
            }
        });

        // 5. Product Manager
        list.Add(new RoleBlueprint {
            Id = "product-manager", Name = "Product Manager",
            CommonSkills = new() { "Roadmap Planning", "User Research", "Sprint Management", "Backlog Grooming", "OKR Setting" },
            Temperature = 0.5, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "long_term",
            HeartbeatInstruction = "Groom the product backlog: re-prioritise the top 5 tasks, flag any blocked user stories, and confirm sprint alignment with current OKRs. Provide a concise backlog health report.",
            Tools = new() {
                new AgentTool { Name = "read_backlog", Description = "Read and prioritize the task backlog", Enabled = true },
                new AgentTool { Name = "write_spec", Description = "Write user story or feature specification", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Research competitors and user feedback", Enabled = true }
            }
        });

        // 6. Developer
        list.Add(new RoleBlueprint {
            Id = "developer", Name = "Developer",
            CommonSkills = new() { "Full-Stack Development", "API Design", "Unit Testing", "CI/CD", "Database Optimization" },
            Temperature = 0.2, MaxTokens = 8192, OutputFormat = "code", MemoryType = "short_term",
            HeartbeatInstruction = "Run a self-diagnostic: review any open pull requests or code review items in your context, check for failing tests, and report your current development status. Propose the single most impactful next coding action.",
            Tools = new() {
                new AgentTool { Name = "code_exec", Description = "Execute code in a sandboxed runtime", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Read files from the project repository", Enabled = true },
                new AgentTool { Name = "write_file", Description = "Write or patch source files", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search documentation and GitHub issues", Enabled = true },
                new AgentTool { Name = "run_tests", Description = "Run automated test suites", Enabled = true }
            }
        });

        // 7. UI Designer
        list.Add(new RoleBlueprint {
            Id = "ui-designer", Name = "UI Designer",
            CommonSkills = new() { "UI/UX Design", "Figma Prototyping", "Design Systems", "Accessibility", "Animation" },
            Temperature = 0.9, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "none",
            HeartbeatInstruction = "Review recent design deliverables and assess consistency with the design system. Highlight any accessibility or visual-hierarchy issues, and generate one concrete design improvement suggestion for the current UI.",
            Tools = new() {
                new AgentTool { Name = "generate_image", Description = "Generate UI mockup images via AI", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Search design inspiration and libraries", Enabled = true },
                new AgentTool { Name = "write_file", Description = "Write CSS / component files", Enabled = false }
            }
        });

        // 8. Marketer
        list.Add(new RoleBlueprint {
            Id = "marketer", Name = "Marketer",
            CommonSkills = new() { "Content Creation", "Social Media", "Email Campaigns", "Copywriting", "A/B Testing" },
            Temperature = 0.8, MaxTokens = 1024, OutputFormat = "plain", MemoryType = "none",
            HeartbeatInstruction = "Review the content calendar status and latest campaign performance. Assess what content is working well, identify gaps, and draft one fresh content idea that aligns with current audience trends.",
            Tools = new() {
                new AgentTool { Name = "generate_copy", Description = "Write marketing copy", Enabled = true },
                new AgentTool { Name = "web_search", Description = "Research trends and keywords", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Send newsletter or campaign emails", Enabled = false }
            }
        });

        // 9. QA Engineer
        list.Add(new RoleBlueprint {
            Id = "qa-engineer", Name = "QA Engineer",
            CommonSkills = new() { "Test Automation", "Regression Testing", "Bug Reporting", "Performance Testing", "API Testing" },
            Temperature = 0.1, MaxTokens = 4096, OutputFormat = "json", MemoryType = "short_term",
            HeartbeatInstruction = "Run a regression sweep on recent code changes. Report any newly discovered bugs as structured JSON, verify test-suite coverage percentage, and flag any high-risk code paths that need immediate review.",
            Tools = new() {
                new AgentTool { Name = "run_tests", Description = "Execute automated test suites", Enabled = true },
                new AgentTool { Name = "read_codebase", Description = "Inspect source code for issues", Enabled = true },
                new AgentTool { Name = "file_bug", Description = "File a bug report in the tracker", Enabled = true },
                new AgentTool { Name = "code_exec", Description = "Run scripts for performance profiling", Enabled = true }
            }
        });

        // 10. Customer Support
        list.Add(new RoleBlueprint {
            Id = "customer-support", Name = "Customer Support",
            CommonSkills = new() { "Ticket Resolution", "Knowledge Base", "SLA Management", "Customer Empathy", "Escalation Handling" },
            Temperature = 0.4, MaxTokens = 512, OutputFormat = "plain", MemoryType = "short_term",
            HeartbeatInstruction = "Check for any unresolved or escalated support tickets. Summarise open issues, assess SLA compliance status, and flag any tickets that require immediate human escalation or a knowledge-base update.",
            Tools = new() {
                new AgentTool { Name = "read_kb", Description = "Read knowledge base articles", Enabled = true },
                new AgentTool { Name = "send_email", Description = "Reply to customer tickets via email", Enabled = true },
                new AgentTool { Name = "escalate", Description = "Escalate unresolved tickets to a human", Enabled = true }
            }
        });

        // Now add 50 other dynamic roles
        string[] extraNames = new string[] {
            "Designer", "Content Creator", "Supervisor", "System Administrator", "Database Administrator",
            "Security Analyst", "Sales Representative", "HR Specialist", "Copywriter", "Social Media Specialist",
            "Data Scientist", "Data Analyst", "DevOps Engineer", "Customer Success Manager", "Solutions Architect",
            "Product Marketing Specialist", "Business Analyst", "Tech Lead", "Scrum Master", "Project Manager",
            "Legal Counsel", "SEO Specialist", "Content Strategist", "Video Editor", "Prompt Engineer",
            "ML Engineer", "Full-Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer",
            "Infrastructure Engineer", "Technical Writer", "Support Tier 2 Specialist", "Support Tier 3 Specialist", "Growth Hacker",
            "Event Coordinator", "Public Relations Specialist", "Operations Coordinator", "Financial Controller", "Auditor",
            "Business Development Manager", "Account Executive", "UI Developer", "Graphic Designer", "Brand Ambassador",
            "Email Marketer", "QA Specialist", "Automation Engineer", "Risk Manager", "Research Scientist"
        };

        var random = new Random(42); // Seed for deterministic traits
        for (int i = 0; i < extraNames.Length; i++)
        {
            var rName = extraNames[i];
            var id = rName.Replace(" ", "-").ToLower();
            
            // Generate some random traits for the additional roles
            double temp = Math.Round(0.1 + random.NextDouble() * 0.8, 2);
            int maxToks = i % 3 == 0 ? 4096 : (i % 2 == 0 ? 2048 : 1024);
            string format = i % 4 == 0 ? "code" : (i % 3 == 0 ? "json" : (i % 2 == 0 ? "markdown" : "plain"));
            string memory = i % 3 == 0 ? "long_term" : (i % 2 == 0 ? "short_term" : "none");

            var skills = new List<string> { rName + " Operations", "Problem Solving", "Collaboration" };
            if (rName.Contains("Developer") || rName.Contains("Engineer") || rName.Contains("Architect") || rName.Contains("Analyst"))
            {
                skills.AddRange(new[] { "Technical Architecture", "Debugging", "Systems Analysis" });
            }
            else if (rName.Contains("Marketing") || rName.Contains("Marketer") || rName.Contains("PR") || rName.Contains("Social") || rName.Contains("Content"))
            {
                skills.AddRange(new[] { "Creative Writing", "Campaign Planning", "Brand Strategy" });
            }
            else
            {
                skills.AddRange(new[] { "Management", "Operations Auditing", "Reporting" });
            }

            var tools = new List<AgentTool> {
                new AgentTool { Name = "web_search", Description = "Search the web for research and validation", Enabled = true }
            };
            if (format == "code")
            {
                tools.Add(new AgentTool { Name = "code_exec", Description = "Run sandbox code validation", Enabled = true });
                tools.Add(new AgentTool { Name = "read_codebase", Description = "Inspect workspace code layout", Enabled = true });
            }
            if (rName.Contains("Support") || rName.Contains("Customer"))
            {
                tools.Add(new AgentTool { Name = "read_kb", Description = "Retrieve knowledge documentation", Enabled = true });
            }
            if (rName.Contains("Marketer") || rName.Contains("Copywriter") || rName.Contains("Creator"))
            {
                tools.Add(new AgentTool { Name = "generate_copy", Description = "Generate promotional copy text", Enabled = true });
            }

            list.Add(new RoleBlueprint {
                Id = id,
                Name = rName,
                CommonSkills = skills.Distinct().ToList(),
                Temperature = temp,
                MaxTokens = maxToks,
                OutputFormat = format,
                MemoryType = memory,
                Tools = tools
            });
        }
        
        return list;
    }

    public async Task<Agent> HireAgentAsync(string name, string role, string subsidiaryId, string? instructions = null, string? modelId = null, AgentRoleDefinition? customOverrides = null)
    {
        var subsidiary = await _subsidiaryRepository.GetByIdAsync(subsidiaryId);
        if (subsidiary == null)
        {
            throw new EntityNotFoundException(nameof(Subsidiary), subsidiaryId);
        }

        // Ensure dynamic blueprints are seeded
        await EnsureRolesSeededAsync();

        var dynamicRoles = await _roleBlueprintRepository.GetAllAsync();
        var blueprint = dynamicRoles.FirstOrDefault(b => b.Name.Equals(role, StringComparison.OrdinalIgnoreCase));
        
        AgentRoleDefinition finalBlueprint;
        if (blueprint == null)
        {
            // Default generic blueprint
            finalBlueprint = new AgentRoleDefinition
            {
                Name = role,
                CommonSkills = new() { "General AI Capabilities", "Task Execution", "Reporting" },
                Temperature = 0.2, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "short_term"
            };
        }
        else
        {
            finalBlueprint = new AgentRoleDefinition
            {
                Name = blueprint.Name,
                CommonSkills = blueprint.CommonSkills,
                Temperature = blueprint.Temperature,
                MaxTokens = blueprint.MaxTokens,
                OutputFormat = blueprint.OutputFormat,
                MemoryType = blueprint.MemoryType,
                Tools = blueprint.Tools
            };
        }

        // Apply overrides if any
        var roleDef = new AgentRoleDefinition
        {
            Name = finalBlueprint.Name,
            CommonSkills = new List<string>(finalBlueprint.CommonSkills),
            Temperature = customOverrides?.Temperature ?? finalBlueprint.Temperature,
            MaxTokens = customOverrides?.MaxTokens != 0 ? (customOverrides?.MaxTokens ?? finalBlueprint.MaxTokens) : finalBlueprint.MaxTokens,
            OutputFormat = !string.IsNullOrEmpty(customOverrides?.OutputFormat) ? customOverrides.OutputFormat : finalBlueprint.OutputFormat,
            MemoryType = !string.IsNullOrEmpty(customOverrides?.MemoryType) ? customOverrides.MemoryType : finalBlueprint.MemoryType,
            Tools = customOverrides?.Tools != null && customOverrides.Tools.Any() ? customOverrides.Tools : finalBlueprint.Tools.Select(t => new AgentTool { Name = t.Name, Description = t.Description, Enabled = t.Enabled }).ToList()
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

        // Determine default heartbeat instruction from blueprint (fallback to generic).
        var defaultHeartbeatInstruction = blueprint?.HeartbeatInstruction is { Length: > 0 } hbi
            ? hbi
            : $"Perform a routine self-status check for your {role} role. Report your current operational readiness, highlight any blockers, and propose one proactive action.";

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
            HeartbeatInstruction = defaultHeartbeatInstruction,
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

    // ── Update ────────────────────────────────────────────────────────────────

    public async Task<Agent?> UpdateAgentAsync(string id, UpdateAgentRequest req, CancellationToken ct = default)
    {
        var agent = await _agentRepository.GetByIdAsync(id);
        if (agent is null) return null;

        // Identity
        if (req.Name is not null)   agent.Name        = req.Name.Trim();
        if (req.Instructions is not null) agent.Instructions = req.Instructions;
        if (req.ModelId is not null) agent.ModelId     = req.ModelId;
        if (req.Avatar is not null)  agent.Avatar      = req.Avatar;
        if (req.Level.HasValue)      agent.Level       = req.Level.Value;
        if (req.Efficiency.HasValue) agent.Efficiency  = Math.Clamp(req.Efficiency.Value, 0.1, 2.0);

        // LLM / Role config
        if (agent.RoleDefinition is not null)
        {
            if (req.Temperature.HasValue)    agent.RoleDefinition.Temperature  = Math.Clamp(req.Temperature.Value, 0.0, 1.0);
            if (req.MaxTokens.HasValue)      agent.RoleDefinition.MaxTokens    = Math.Max(1, req.MaxTokens.Value);
            if (req.OutputFormat is not null) agent.RoleDefinition.OutputFormat = req.OutputFormat;
            if (req.MemoryType is not null)   agent.RoleDefinition.MemoryType  = req.MemoryType;
            if (req.Tools is not null)        agent.RoleDefinition.Tools       = req.Tools;
        }

        // Heartbeat
        if (req.HeartbeatEnabled.HasValue)         agent.HeartbeatEnabled         = req.HeartbeatEnabled.Value;
        if (req.HeartbeatIntervalMinutes.HasValue)  agent.HeartbeatIntervalMinutes = Math.Clamp(req.HeartbeatIntervalMinutes.Value, 1, 1440);
        if (req.HeartbeatInstruction is not null)   agent.HeartbeatInstruction     = req.HeartbeatInstruction;

        // Recalculate next heartbeat if enabled and interval changed
        if (agent.HeartbeatEnabled && req.HeartbeatIntervalMinutes.HasValue)
        {
            agent.NextHeartbeatAt = DateTime.UtcNow
                .AddMinutes(agent.HeartbeatIntervalMinutes)
                .ToString("o");
        }
        else if (!agent.HeartbeatEnabled)
        {
            agent.NextHeartbeatAt = null;
        }

        await _agentRepository.SaveAsync(agent);
        return agent;
    }

    // ── Seed heartbeat instructions for existing agents ────────────────────────

    public async Task SeedHeartbeatInstructionsAsync(CancellationToken ct = default)
    {
        await EnsureRolesSeededAsync();
        var blueprints = (await _roleBlueprintRepository.GetAllAsync()).ToList();
        var agents     = (await _agentRepository.GetAllAsync()).ToList();

        var blueprintMap = blueprints
            .Where(b => !string.IsNullOrWhiteSpace(b.HeartbeatInstruction))
            .ToDictionary(b => b.Name, b => b.HeartbeatInstruction, StringComparer.OrdinalIgnoreCase);

        int updated = 0;
        foreach (var agent in agents)
        {
            if (!string.IsNullOrWhiteSpace(agent.HeartbeatInstruction)) continue;

            agent.HeartbeatInstruction = blueprintMap.TryGetValue(agent.Role, out var instr)
                ? instr
                : $"Perform a routine self-status check for your {agent.Role} role. Report your current operational readiness, highlight any blockers, and propose one proactive action.";

            await _agentRepository.SaveAsync(agent);
            updated++;
        }
    }

    public async Task<IEnumerable<ExecutionLogDto>> GetExecutionLogsAsync(int limit = 1000, double? hours = null)
    {
        var allLogs = new List<ExecutionLogDto>();
        var thresholdDate = hours.HasValue ? DateTime.UtcNow.AddHours(-hours.Value) : (DateTime?)null;

        var heartbeats = await _heartbeatLogRepository.GetAllAsync();
        foreach (var hb in heartbeats)
        {
            if (thresholdDate.HasValue && DateTime.TryParse(hb.Timestamp, out var hbDate) && hbDate.ToUniversalTime() < thresholdDate.Value)
                continue;

            allLogs.Add(new ExecutionLogDto
            {
                Id = hb.Id,
                AgentId = hb.AgentId,
                AgentName = hb.AgentName,
                Type = "Heartbeat",
                Timestamp = hb.Timestamp,
                Input = hb.Instruction,
                Output = hb.Response,
                Status = hb.Success ? "Success" : "Failed"
            });
        }

        var tasks = await _taskRepository.GetAllAsync();
        var agents = (await _agentRepository.GetAllAsync()).ToDictionary(a => a.Id, a => a.Name);
        foreach (var t in tasks)
        {
            // Try to extract timestamp from task ID if possible, otherwise use a fallback string (empty means sort to bottom)
            string ts = "";
            if (t.Id.StartsWith("task-") && long.TryParse(t.Id.Replace("task-", ""), out var unixMs))
            {
                var dt = DateTimeOffset.FromUnixTimeMilliseconds(unixMs).UtcDateTime;
                if (thresholdDate.HasValue && dt < thresholdDate.Value)
                    continue;

                ts = dt.ToString("o");
            }
            
            var agentName = agents.TryGetValue(t.AssignedAgentId, out var name) ? name : "Unknown";

            allLogs.Add(new ExecutionLogDto
            {
                Id = t.Id,
                AgentId = t.AssignedAgentId,
                AgentName = agentName,
                Type = "Task",
                Timestamp = ts,
                Input = t.Description,
                Output = string.IsNullOrWhiteSpace(t.Output) ? string.Join("\n", t.Logs) : t.Output,
                Status = t.Status
            });
        }

        foreach (var kvp in agents)
        {
            var agent = await _agentRepository.GetByIdAsync(kvp.Key);
            if (agent == null || agent.ConversationHistory == null) continue;

            for (int i = 0; i < agent.ConversationHistory.Count - 1; i++)
            {
                var msg = agent.ConversationHistory[i];
                if (msg.Role == "user" && agent.ConversationHistory[i + 1].Role == "assistant")
                {
                    var responseMsg = agent.ConversationHistory[i + 1];
                    
                    if (thresholdDate.HasValue && DateTime.TryParse(responseMsg.Timestamp, out var chatDate) && chatDate.ToUniversalTime() < thresholdDate.Value)
                        continue;

                    allLogs.Add(new ExecutionLogDto
                    {
                        Id = $"chat-{kvp.Key}-{i}",
                        AgentId = agent.Id,
                        AgentName = agent.Name,
                        Type = "Chat",
                        Timestamp = responseMsg.Timestamp,
                        Input = msg.Content,
                        Output = responseMsg.Content,
                        Status = "Completed"
                    });
                }
            }
        }

        return allLogs.OrderByDescending(x => x.Timestamp).Take(limit);
    }
}
