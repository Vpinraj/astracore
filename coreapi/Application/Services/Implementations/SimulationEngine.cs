using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoreApi.Core.Entities;
using CoreApi.Core.Repositories;
using CoreApi.Application.Services.Interfaces;

namespace CoreApi.Application.Services.Implementations;

public class SimulationEngine : ISimulationEngine
{
    private readonly IRepository<Subsidiary> _subsidiaryRepository;
    private readonly IRepository<Agent> _agentRepository;
    private readonly IRepository<TaskItem> _taskRepository;
    private readonly IRepository<ActivityLog> _logRepository;
    private readonly ILogService _logService;
    private readonly ITransactionService _transactionService;
    private readonly ILeadService _leadService;
    private readonly IEmployeeService _employeeService;

    private static readonly Dictionary<string, List<string>> AGENT_THOUGHTS = new(StringComparer.OrdinalIgnoreCase)
    {
        { "CEO", new() {
            "Refining organizational roadmap...",
            "Reviewing quarterly metrics and agent efficiency...",
            "Drafting partnership proposals with external APIs...",
            "Strategizing long-term investment vectors...",
            "Evaluating subsidiary contribution metrics..."
        }},
        { "CFO", new() {
            "Balancing the ledger and tracking server costs...",
            "Auditing token spend and operational overhead...",
            "Drafting financial summaries for the Director...",
            "Optimizing capital allocation across active projects...",
            "Forecasting profit margins and task yield rates..."
        }},
        { "CTO", new() {
            "Reviewing system architecture parameters...",
            "Optimizing token execution latency...",
            "Configuring agent pipeline standard integrations...",
            "Assessing tech debt in AI code generators...",
            "Refining data storage protocols for high throughput..."
        }},
        { "CMO", new() {
            "Analyzing audience acquisition metrics...",
            "Drafting content calendar and agent promotional campaigns...",
            "A/B testing user engagement copy...",
            "Structuring brand positioning guidelines...",
            "Optimizing SEO keywords and referral loops..."
        }},
        { "Product Manager", new() {
            "Mapping user stories to development sprints...",
            "Prioritizing feature backlog based on ROI projections...",
            "Conducting competitor dashboard reviews...",
            "Defining acceptance criteria for pending milestones...",
            "Synthesizing feedback from customer agent logs..."
        }},
        { "Developer", new() {
            "Refactoring API route handlers...",
            "Writing unit tests for agent execution queues...",
            "Debugging concurrent state updates...",
            "Optimizing SQL queries and caching layer...",
            "Deploying hotfixes to serverless containers..."
        }},
        { "UI Designer", new() {
            "Polishing glassmorphic layout tokens...",
            "Designing glowing button states and active hover micro-interactions...",
            "Creating high-fidelity vector layouts for the client portal...",
            "Optimizing visual hierarchy and loading skeletons...",
            "Establishing cohesive typography scale..."
        }},
        { "Marketer", new() {
            "Writing newsletter copy for product updates...",
            "Monitoring click-through ratios on active channels...",
            "Setting up keyword campaigns for AI integration tools...",
            "Curating community showcase threads...",
            "Engaging target audiences on social forums..."
        }},
        { "QA Engineer", new() {
            "Executing end-to-end integration test suites...",
            "Writing regression tests for the chat processor...",
            "Conducting performance stress tests on database clusters...",
            "Filing bug tickets for styling inconsistencies...",
            "Verifying API response contracts..."
        }},
        { "Customer Support", new() {
            "Resolving user ticketing logs...",
            "Drafting knowledge base articles for setup anomalies...",
            "Triage of incident reports from active client nodes...",
            "Synthesizing customer satisfaction indexes...",
            "Following up on service SLA escalations..."
        }}
    };

    public SimulationEngine(
        IRepository<Subsidiary> subsidiaryRepository,
        IRepository<Agent> agentRepository,
        IRepository<TaskItem> taskRepository,
        IRepository<ActivityLog> logRepository,
        ILogService logService,
        ITransactionService transactionService,
        ILeadService leadService,
        IEmployeeService employeeService)
    {
        _subsidiaryRepository = subsidiaryRepository;
        _agentRepository = agentRepository;
        _taskRepository = taskRepository;
        _logRepository = logRepository;
        _logService = logService;
        _transactionService = transactionService;
        _leadService = leadService;
        _employeeService = employeeService;
    }

    public async Task<SimulationState> GetStateAsync()
    {
        var subsidiaries = (await _subsidiaryRepository.GetAllAsync()).ToList();

        if (!subsidiaries.Any())
        {
            return await SeedDefaultStateAsync();
        }

        var agents = (await _agentRepository.GetAllAsync()).ToList();
        var tasks = (await _taskRepository.GetAllAsync()).ToList();
        var logs = (await _logRepository.GetAllAsync()).OrderByDescending(l => l.Id).ToList();
        var transactions = (await _transactionService.GetAllAsync()).OrderByDescending(t => t.Timestamp).ToList();
        var leads = (await _leadService.GetAllAsync()).ToList();
        var employees = (await _employeeService.GetAllAsync()).ToList();

        return new SimulationState
        {
            Subsidiaries = subsidiaries,
            Agents = agents,
            Tasks = tasks,
            Logs = logs,
            Transactions = transactions,
            Leads = leads,
            Employees = employees
        };
    }

    public async Task SaveStateAsync(SimulationState state)
    {
        // 1. Sync Subsidiaries
        var currentSubs = (await _subsidiaryRepository.GetAllAsync()).ToList();
        foreach (var sub in currentSubs)
        {
            if (!state.Subsidiaries.Any(s => s.Id == sub.Id))
                await _subsidiaryRepository.DeleteAsync(sub.Id);
        }
        foreach (var sub in state.Subsidiaries)
        {
            await _subsidiaryRepository.SaveAsync(sub);
        }

        // 2. Sync Agents
        var currentAgents = (await _agentRepository.GetAllAsync()).ToList();
        foreach (var agent in currentAgents)
        {
            if (!state.Agents.Any(a => a.Id == agent.Id))
                await _agentRepository.DeleteAsync(agent.Id);
        }
        foreach (var agent in state.Agents)
        {
            await _agentRepository.SaveAsync(agent);
        }

        // 3. Sync Tasks
        var currentTasks = (await _taskRepository.GetAllAsync()).ToList();
        foreach (var task in currentTasks)
        {
            if (!state.Tasks.Any(t => t.Id == task.Id))
                await _taskRepository.DeleteAsync(task.Id);
        }
        foreach (var task in state.Tasks)
        {
            await _taskRepository.SaveAsync(task);
        }

        // 4. Sync Logs
        var currentLogs = (await _logRepository.GetAllAsync()).ToList();
        foreach (var log in currentLogs)
        {
            if (!state.Logs.Any(l => l.Id == log.Id))
                await _logRepository.DeleteAsync(log.Id);
        }
        foreach (var log in state.Logs)
        {
            await _logRepository.SaveAsync(log);
        }
    }

    public async Task<SimulationState> ResetStateAsync()
    {
        // Clear all collections
        var subsidiaries = await _subsidiaryRepository.GetAllAsync();
        foreach (var item in subsidiaries) await _subsidiaryRepository.DeleteAsync(item.Id);

        var agents = await _agentRepository.GetAllAsync();
        foreach (var item in agents) await _agentRepository.DeleteAsync(item.Id);

        var tasks = await _taskRepository.GetAllAsync();
        foreach (var item in tasks) await _taskRepository.DeleteAsync(item.Id);

        await _logService.ClearAllAsync();
        await _transactionService.ClearAllAsync();
        await _leadService.ClearAllAsync();
        await _employeeService.ClearAllAsync();

        return await SeedDefaultStateAsync();
    }

    public async Task<SimulationState> TickAsync()
    {
        var subsidiaries = (await _subsidiaryRepository.GetAllAsync()).ToList();
        var agents = (await _agentRepository.GetAllAsync()).ToList();
        var tasks = (await _taskRepository.GetAllAsync()).ToList();

        var random = new Random();

        foreach (var task in tasks.Where(t => t.Status.Equals("in_progress", StringComparison.OrdinalIgnoreCase)))
        {
            var agent = agents.FirstOrDefault(a => a.Id == task.AssignedAgentId);
            var sub = subsidiaries.FirstOrDefault(s => s.Id == task.SubsidiaryId);

            if (agent == null) continue;

            // Step progress
            double baseStep = 6 + random.NextDouble() * 8;
            int step = Math.Min(100 - task.Progress, (int)Math.Round(baseStep * agent.Efficiency));
            task.Progress += step;

            // Pick a thought
            var thoughts = AGENT_THOUGHTS.TryGetValue(agent.Role, out var tList)
                ? tList
                : new List<string> { "Processing steps...", "Refining data structures..." };

            var thought = thoughts[random.Next(thoughts.Count)];
            task.Logs.Add($"{agent.Role} {agent.Name}: {thought}");

            if (task.Progress < 100)
            {
                // Occasional global logging
                if (random.NextDouble() > 0.7)
                {
                    await _logService.AddLogAsync(
                        $"{agent.Name} is working on \"{task.Title}\": {thought}",
                        "agent_action",
                        subsidiaryName: sub?.Name,
                        agentName: agent.Name
                    );
                }
            }
            else
            {
                // Task is completed
                task.Status = "completed";
                task.Logs.Add($"Task completed! Revenue payload generated: ₹{task.Payout:N0}");

                if (sub != null)
                {
                    // 1. Record the primary task completion as a "Sale" transaction
                    double payout = task.Payout;
                    double subtotal = Math.Round(payout / 1.18, 2);
                    double tax = Math.Round(subtotal * 0.09, 2);
                    double diff = payout - (subtotal + tax + tax);
                    subtotal += diff;

                    string invNum = $"INV-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() % 1000000:D6}";
                    await _transactionService.RecordTransactionAsync(
                        subsidiaryId: sub.Id,
                        type: "Sale",
                        subtotal: subtotal,
                        discount: 0,
                        cgst: tax,
                        sgst: tax,
                        totalAmount: payout,
                        amountPaidOrReceived: payout,
                        description: $"Revenue payout for task completion: {task.Title}",
                        referenceNumber: invNum,
                        partnerName: "Enterprise Client",
                        documentUrl: "",
                        processedByAgentId: agent.Id,
                        status: "Completed"
                    );

                    // 2. Generate random procurement transactions (Expense)
                    int procurementCount = random.Next(1, 3);
                    for (int i = 0; i < procurementCount; i++)
                    {
                        double cost = random.Next(500, 2500);
                        double pSubtotal = Math.Round(cost / 1.18, 2);
                        double pTax = Math.Round(pSubtotal * 0.09, 2);
                        double pDiff = cost - (pSubtotal + pTax + pTax);
                        pSubtotal += pDiff;

                        string billNum = $"BILL-{random.Next(100000, 999999)}";
                        string[] vendors = { "AWS Cloud Services", "Google Cloud Platform", "OpenAI API Dev", "GitHub Enterprise", "Slack Technologies" };
                        string vendor = vendors[random.Next(vendors.Length)];

                        await _transactionService.RecordTransactionAsync(
                            subsidiaryId: sub.Id,
                            type: "Procurement",
                            subtotal: pSubtotal,
                            discount: 0,
                            cgst: pTax,
                            sgst: pTax,
                            totalAmount: cost,
                            amountPaidOrReceived: cost,
                            description: $"Procured technical resources & API credits",
                            referenceNumber: billNum,
                            partnerName: vendor,
                            documentUrl: "",
                            processedByAgentId: agent.Id,
                            status: "Completed"
                        );
                    }

                    // 3. Generate CRM leads (not financial transactions)
                    string[] sources = { "Inbound", "Outbound", "Referral", "Campaign" };
                    string[] stages = { "New", "Contacted", "Qualified" };
                    string[] companies = { "Aura Industries", "Zenith Systems", "NovaTech Corp", "Orbita Labs", "Quantum Dynamics", "BlueStar Solutions" };
                    int leadCount = random.Next(1, 4);
                    for (int i = 0; i < leadCount; i++)
                    {
                        string contactFirst = new string[] { "Priya", "Rahul", "Ananya", "Arjun", "Deepa", "Vikram" }[random.Next(6)];
                        string contactLast = new string[] { "Sharma", "Gupta", "Patel", "Nair", "Reddy", "Singh" }[random.Next(6)];
                        await _leadService.CreateLeadAsync(
                            subsidiaryId: sub.Id,
                            contactName: $"{contactFirst} {contactLast}",
                            companyName: companies[random.Next(companies.Length)],
                            email: $"{contactFirst.ToLower()}.{contactLast.ToLower()}@example.com",
                            phone: $"+91 98{random.Next(10000000, 99999999)}",
                            source: sources[random.Next(sources.Length)],
                            stage: stages[random.Next(stages.Length)],
                            estimatedValue: random.Next(10000, 500000),
                            assignedToId: agent.Id,
                            assignedToName: agent.Name,
                            notes: $"Lead generated from completed task: {task.Title}"
                        );
                    }
                }

                agent.Status = "idle";
                agent.ActiveTaskId = null;
                agent.Level += 1;
                await _agentRepository.SaveAsync(agent);

                await _logService.AddLogAsync(
                    $"SUCCESS: {agent.Name} ({agent.Role}) completed \"{task.Title}\". Generated ₹{task.Payout:N0} in profit for {sub?.Name}!",
                    "success",
                    subsidiaryName: sub?.Name,
                    agentName: agent.Name
                );
            }

            await _taskRepository.SaveAsync(task);
        }

        // Return refreshed state
        return await GetStateAsync();
    }

    private async Task<SimulationState> SeedDefaultStateAsync()
    {
        var seed = GetDefaultSeedState();

        foreach (var sub in seed.Subsidiaries)
            await _subsidiaryRepository.SaveAsync(sub);

        foreach (var agent in seed.Agents)
            await _agentRepository.SaveAsync(agent);

        foreach (var task in seed.Tasks)
            await _taskRepository.SaveAsync(task);

        foreach (var log in seed.Logs)
            await _logRepository.SaveAsync(log);

        // Seed Transaction History (GST-compliant)
        // 1. CyberCore AI (sub-1)
        await _transactionService.RecordTransactionAsync("sub-1", "Investment", 150000, 0, 0, 0, 150000, 150000, "Initial seed investment funding", "INV-SEED-001", "Parent Corp");
        await _transactionService.RecordTransactionAsync("sub-1", "Sale", 33898.31, 0, 3050.85, 3050.85, 40000, 40000, "Enterprise software licensing agreement", "INV-2026-001", "CoreTech Inc", processedByAgentId: "agent-1");
        await _transactionService.RecordTransactionAsync("sub-1", "Procurement", 21186.44, 0, 1906.78, 1906.78, 25000, 25000, "GPU server nodes provisioning", "BILL-2026-001", "AWS Cloud Services", processedByAgentId: "agent-2");

        // 2. Nexus Media (sub-2)
        await _transactionService.RecordTransactionAsync("sub-2", "Investment", 100000, 0, 0, 0, 100000, 100000, "Initial seed investment funding", "INV-SEED-002", "Parent Corp");
        await _transactionService.RecordTransactionAsync("sub-2", "Sale", 4237.29, 0, 381.36, 381.36, 5000, 5000, "Creative design consultation assets", "INV-2026-002", "Creative Hub", processedByAgentId: "agent-3");
        await _transactionService.RecordTransactionAsync("sub-2", "Procurement", 12711.86, 0, 1144.07, 1144.07, 15000, 15000, "Enterprise design suite licenses", "BILL-2026-002", "Adobe Systems", processedByAgentId: "agent-4");

        // 3. Common (common)
        await _transactionService.RecordTransactionAsync("common", "Investment", 50000, 0, 0, 0, 50000, 50000, "Initial general operations allocation", "INV-SEED-HQ", "Parent Corp");
        await _transactionService.RecordTransactionAsync("common", "Expense", 1694.92, 0, 152.54, 152.54, 2000, 2000, "Office maintenance and utilities fee", "BILL-2026-003", "MG Road Tech Park");

        // Seed CRM Leads (now separate from financial transactions)
        // CyberCore AI leads
        await _leadService.CreateLeadAsync("sub-1", "Priya Sharma", "Aura Industries", "priya.sharma@aura.in", "+91 9812345678", "Inbound", "Qualified", 250000, "agent-1", "Ada Lovelace", "Interested in foundation model licensing");
        await _leadService.CreateLeadAsync("sub-1", "Rahul Gupta", "Zenith Systems", "rahul.gupta@zenith.io", "+91 9876543210", "Referral", "Contacted", 180000, "agent-2", "Alan Turing", "Referred by CyberCore partner");
        await _leadService.CreateLeadAsync("sub-1", "Ananya Patel", "NovaTech Corp", "ananya.p@novatech.com", "+91 9765432109", "Campaign", "New", 500000, "agent-1", "Ada Lovelace", "Downloaded AI whitepaper");
        await _leadService.CreateLeadAsync("sub-1", "Arjun Nair", "Orbita Labs", "arjun.nair@orbita.io", "+91 9654321098", "Outbound", "Proposal", 750000, "agent-2", "Alan Turing", "Proposal sent for AI pipeline integration");

        // Nexus Media leads
        await _leadService.CreateLeadAsync("sub-2", "Deepa Reddy", "Bright Media Group", "deepa.r@brightmedia.co", "+91 9543210987", "Inbound", "New", 120000, "agent-3", "Claude Shannon", "Requested branding consultation");
        await _leadService.CreateLeadAsync("sub-2", "Vikram Singh", "BlueWave Ads", "vikram.s@bluewave.in", "+91 9432109876", "Outbound", "Contacted", 85000, "agent-4", "Grace Hopper", "Outreach for programmatic advertising");
        await _leadService.CreateLeadAsync("sub-2", "Riya Mehta", "PixelForge Studio", "riya.m@pixelforge.co", "+91 9321098765", "Referral", "Won", 200000, "agent-3", "Claude Shannon", "Contract signed for 6-month content retainer");

        // Common (HQ) leads
        await _leadService.CreateLeadAsync("common", "Suresh Krishnan", "GlobalTech Partners", "suresh.k@globaltech.com", "+91 9210987654", "Campaign", "Qualified", 1500000, "", "HQ Director", "Strategic partnership inquiry for group services");

        // Seed Human Employees
        // CyberCore AI employees
        await _employeeService.CreateEmployeeAsync("Kavya Iyer", "Senior Software Engineer", "Engineering", "sub-1", "kavya.iyer@cybercore.ai", "+91 80 4123 0001", 120000, "2024-03-15", "agent-2", "Alan Turing", "👩‍💻", "Active");
        await _employeeService.CreateEmployeeAsync("Rohan Malhotra", "ML Research Engineer", "Engineering", "sub-1", "rohan.m@cybercore.ai", "+91 80 4123 0002", 140000, "2024-01-10", "agent-2", "Alan Turing", "👨‍🔬", "Active");
        await _employeeService.CreateEmployeeAsync("Sneha Kapoor", "Product Analyst", "Product", "sub-1", "sneha.k@cybercore.ai", "+91 80 4123 0003", 95000, "2024-06-01", "agent-1", "Ada Lovelace", "👩‍💼", "Active");

        // Nexus Media employees
        await _employeeService.CreateEmployeeAsync("Aditya Rao", "Creative Director", "Design", "sub-2", "aditya.r@nexusmedia.co", "+91 22 2654 0001", 110000, "2023-11-20", "agent-3", "Claude Shannon", "🎨", "Active");
        await _employeeService.CreateEmployeeAsync("Nisha Joshi", "Social Media Manager", "Marketing", "sub-2", "nisha.j@nexusmedia.co", "+91 22 2654 0002", 75000, "2024-02-14", "agent-3", "Claude Shannon", "📱", "Active");

        // Common (HQ) employees
        await _employeeService.CreateEmployeeAsync("Sanjay Verma", "Head of Finance", "Finance", "common", "sanjay.v@astracore.internal", "+91 80 4999 0001", 200000, "2023-06-01", "", "Director", "💼", "Active");
        await _employeeService.CreateEmployeeAsync("Meera Pillai", "HR Business Partner", "HR", "common", "meera.p@astracore.internal", "+91 80 4999 0002", 90000, "2023-09-01", "sanjay_placeholder", "Sanjay Verma", "👩‍💼", "Active");

        return seed;
    }

    private SimulationState GetDefaultSeedState()
    {
        return new SimulationState
        {
            Subsidiaries = new List<Subsidiary>
            {
                new Subsidiary
                {
                    Id = "sub-1",
                    Name = "CyberCore AI",
                    Industry = "AI Software",
                    Investment = 0,
                    Balance = 0,
                    Expenses = 0,
                    Profits = 0,
                    Color = "from-purple-600 to-indigo-600",
                    BorderColor = "border-purple-500/30",
                    TextColor = "text-purple-400",
                    Icon = "Cpu",
                    LogoUrl = "",
                    Website = "https://cybercore.ai",
                    Email = "ops@cybercore.ai",
                    Phone = "+91 80 4123 4567",
                    Description = "Advanced artificial intelligence software cluster developing foundation models and agentic workflows.",
                    Address = "Building 4, Tech Park, Outer Ring Road, Bangalore, India",
                    BankDetails = "HDFC Bank - A/C: 50200012345678, IFSC: HDFC0000123",
                    Procurements = 11,
                    Sales = 27
                },
                new Subsidiary
                {
                    Id = "sub-2",
                    Name = "Nexus Media",
                    Industry = "Creative Agency",
                    Investment = 0,
                    Balance = 0,
                    Expenses = 0,
                    Profits = 0,
                    Color = "from-blue-600 to-cyan-600",
                    BorderColor = "border-blue-500/30",
                    TextColor = "text-blue-400",
                    Icon = "Palette",
                    LogoUrl = "",
                    Website = "https://nexusmedia.co",
                    Email = "hello@nexusmedia.co",
                    Phone = "+91 22 2654 3210",
                    Description = "Next-generation digital media agency creating interactive marketing campaigns and viral content strategies.",
                    Address = "Wework Galaxy, MG Road, Bangalore, India",
                    BankDetails = "ICICI Bank - A/C: 000405123456, IFSC: ICIC0000004",
                    Procurements = 7,
                    Sales = 14
                },
                new Subsidiary
                {
                    Id = "common",
                    Name = "Common",
                    Industry = "Global Operations",
                    Investment = 0,
                    Balance = 0,
                    Expenses = 0,
                    Profits = 0,
                    Color = "from-zinc-700 to-slate-800",
                    BorderColor = "border-zinc-500/30",
                    TextColor = "text-zinc-400",
                    Icon = "Globe",
                    LogoUrl = "",
                    Website = "",
                    Email = "hq@astracore.internal",
                    Phone = "+91 80 4999 9999",
                    Description = "Shared resources and corporate treasury operations for all subsidiaries.",
                    Address = "Corporate HQ, MG Road, Bangalore, India",
                    BankDetails = "SBI - A/C: 30001234567, IFSC: SBIN0000001",
                    Procurements = 0,
                    Sales = 0
                }
            },
            Agents = new List<Agent>
            {
                new Agent
                {
                    Id = "agent-1",
                    Name = "Ada Lovelace",
                    Role = "CEO",
                    RoleDefinition = new AgentRoleDefinition
                    {
                        Name = "CEO",
                        CommonSkills = new List<string> { "Strategic Planning", "Leadership", "Decision Making", "Stakeholder Management", "Vision Setting" },
                        Temperature = 0.5, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "long_term",
                        Tools = new List<AgentTool>
                        {
                            new AgentTool { Name = "read_reports",   Description = "Read financial and operational reports", Enabled = true },
                            new AgentTool { Name = "send_directive", Description = "Issue directives to subordinate agents", Enabled = true },
                            new AgentTool { Name = "web_search",     Description = "Search the web for market intelligence", Enabled = true },
                        }
                    },
                    Instructions = "You are the CEO of CyberCore AI. Drive strategic growth, manage agent performance, and make high-level decisions to maximize subsidiary profit.",
                    ModelId = "gemini-2.0-flash",
                    SubsidiaryId = "sub-1", Status = "idle", Avatar = "👩‍💼", Level = 4, Efficiency = 1.25,
                    ConversationHistory = new()
                    {
                        new ConversationMessage { Role = "system", Content = "You are the CEO of CyberCore AI. Drive strategic growth, manage agent performance, and make high-level decisions to maximize subsidiary profit.", Timestamp = DateTime.UtcNow.ToString("o") }
                    }
                },
                new Agent
                {
                    Id = "agent-2",
                    Name = "Alan Turing",
                    Role = "CTO",
                    RoleDefinition = new AgentRoleDefinition
                    {
                        Name = "CTO",
                        CommonSkills = new List<string> { "System Architecture", "AI/ML Pipelines", "DevOps", "Code Review", "Tech Strategy" },
                        Temperature = 0.3, MaxTokens = 4096, OutputFormat = "code", MemoryType = "short_term",
                        Tools = new List<AgentTool>
                        {
                            new AgentTool { Name = "code_exec",      Description = "Execute code in a sandboxed runtime",   Enabled = true },
                            new AgentTool { Name = "read_codebase",  Description = "Read source files from the repository", Enabled = true },
                            new AgentTool { Name = "web_search",     Description = "Search docs and Stack Overflow",        Enabled = true },
                            new AgentTool { Name = "deploy_service", Description = "Trigger CI/CD deployment pipeline",     Enabled = false },
                        }
                    },
                    Instructions = "You are the CTO of CyberCore AI. Oversee all technical architecture decisions, AI pipeline quality, and developer productivity.",
                    ModelId = "gemini-2.0-flash",
                    SubsidiaryId = "sub-1", Status = "working", ActiveTaskId = "task-1", Avatar = "👨‍💻", Level = 5, Efficiency = 1.4,
                    ConversationHistory = new()
                    {
                        new ConversationMessage { Role = "system", Content = "You are the CTO of CyberCore AI. Oversee all technical architecture decisions, AI pipeline quality, and developer productivity.", Timestamp = DateTime.UtcNow.ToString("o") }
                    }
                },
                new Agent
                {
                    Id = "agent-3",
                    Name = "Claude Shannon",
                    Role = "CMO",
                    RoleDefinition = new AgentRoleDefinition
                    {
                        Name = "CMO",
                        CommonSkills = new List<string> { "Brand Strategy", "Growth Marketing", "Campaign Management", "SEO/SEM", "Audience Analytics" },
                        Temperature = 0.7, MaxTokens = 2048, OutputFormat = "markdown", MemoryType = "short_term",
                        Tools = new List<AgentTool>
                        {
                            new AgentTool { Name = "web_search",    Description = "Research trends and competitor activity", Enabled = true },
                            new AgentTool { Name = "generate_copy", Description = "Generate ad/content copy",                Enabled = true },
                            new AgentTool { Name = "send_email",    Description = "Send campaign emails",                    Enabled = false },
                        }
                    },
                    Instructions = "You are the CMO of Nexus Media. Design and execute marketing campaigns that maximize audience reach and drive revenue through creative content.",
                    ModelId = "gemini-2.0-flash",
                    SubsidiaryId = "sub-2", Status = "working", ActiveTaskId = "task-2", Avatar = "👨‍💼", Level = 3, Efficiency = 1.05,
                    ConversationHistory = new()
                    {
                        new ConversationMessage { Role = "system", Content = "You are the CMO of Nexus Media. Design and execute marketing campaigns that maximize audience reach and drive revenue through creative content.", Timestamp = DateTime.UtcNow.ToString("o") }
                    }
                },
                new Agent
                {
                    Id = "agent-4",
                    Name = "Grace Hopper",
                    Role = "CFO",
                    RoleDefinition = new AgentRoleDefinition
                    {
                        Name = "CFO",
                        CommonSkills = new List<string> { "Financial Analysis", "Budget Allocation", "Risk Assessment", "Cost Optimization", "Forecasting" },
                        Temperature = 0.2, MaxTokens = 1024, OutputFormat = "json", MemoryType = "long_term",
                        Tools = new List<AgentTool>
                        {
                            new AgentTool { Name = "read_ledger",     Description = "Access the subsidiary financial ledger", Enabled = true },
                            new AgentTool { Name = "generate_report", Description = "Generate formatted financial reports",   Enabled = true },
                            new AgentTool { Name = "alert_ceo",       Description = "Send budget alerts to the CEO",         Enabled = true },
                        }
                    },
                    Instructions = "You are the CFO of Nexus Media. Ensure financial discipline, audit expenses, optimize resource allocation, and produce accurate profit forecasts.",
                    ModelId = "gemini-2.0-flash",
                    SubsidiaryId = "sub-2", Status = "idle", Avatar = "👩‍💻", Level = 4, Efficiency = 1.15,
                    ConversationHistory = new()
                    {
                        new ConversationMessage { Role = "system", Content = "You are the CFO of Nexus Media. Ensure financial discipline, audit expenses, optimize resource allocation, and produce accurate profit forecasts.", Timestamp = DateTime.UtcNow.ToString("o") }
                    }
                }
            },
            Tasks = new List<TaskItem>
            {
                new TaskItem
                {
                    Id = "task-1",
                    Title = "Train LLM Foundation Model",
                    Description = "Optimize transformer weights on pre-training datasets to increase model precision.",
                    AssignedAgentId = "agent-2",
                    SubsidiaryId = "sub-1",
                    Status = "in_progress",
                    Progress = 45,
                    Payout = 45000,
                    Cost = 8000,
                    Duration = 20,
                    Logs = new List<string> { "Initialized training nodes...", "Loading pre-training tensor weight graphs..." }
                },
                new TaskItem
                {
                    Id = "task-2",
                    Title = "Launch viral campaign",
                    Description = "Design and deploy programmatic ads targeting tech builders and creators.",
                    AssignedAgentId = "agent-3",
                    SubsidiaryId = "sub-2",
                    Status = "in_progress",
                    Progress = 75,
                    Payout = 25000,
                    Cost = 3000,
                    Duration = 15,
                    Logs = new List<string> { "Scraping trends...", "Optimizing target keywords..." }
                }
            },
            Logs = new List<ActivityLog>
            {
                new ActivityLog
                {
                    Id = "log-1",
                    Timestamp = DateTime.Now.ToShortTimeString(),
                    Message = "CyberCore AI subsidiary initialized with $150,000 initial investment.",
                    Type = "info",
                    SubsidiaryName = "CyberCore AI"
                },
                new ActivityLog
                {
                    Id = "log-2",
                    Timestamp = DateTime.Now.ToShortTimeString(),
                    Message = "Nexus Media subsidiary initialized with $100,000 initial investment.",
                    Type = "info",
                    SubsidiaryName = "Nexus Media"
                },
                new ActivityLog
                {
                    Id = "log-3",
                    Timestamp = DateTime.Now.ToShortTimeString(),
                    Message = "CTO Alan Turing started task: Train LLM Foundation Model.",
                    Type = "agent_action",
                    SubsidiaryName = "CyberCore AI",
                    AgentName = "Alan Turing"
                },
                new ActivityLog
                {
                    Id = "log-4",
                    Timestamp = DateTime.Now.ToShortTimeString(),
                    Message = "CMO Claude Shannon started task: Launch viral campaign.",
                    Type = "agent_action",
                    SubsidiaryName = "Nexus Media",
                    AgentName = "Claude Shannon"
                }
            }
        };
    }
}
