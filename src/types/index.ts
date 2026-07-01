export interface Subsidiary {
  id: string;
  name: string;
  industry: string;
  investment: number;
  balance: number;
  expenses: number;
  profits: number;
  color: string;       // Tailwind gradient class e.g. 'from-purple-500 to-indigo-600'
  borderColor: string; // Tailwind border class  e.g. 'border-purple-500/30'
  textColor: string;   // Tailwind text class    e.g. 'text-purple-400'
  icon: string;        // Lucide icon name
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  address?: string;
  bankDetails?: string;
  procurements?: number;
  sales?: number;
}

// ─────────────────────────────────────────────
// AGENT ROLE DEFINITION
// A rich blueprint that describes what an agent
// of this role can do and how its LLM should behave
// ─────────────────────────────────────────────
export type AgentOutputFormat = 'markdown' | 'json' | 'plain' | 'code';
export type AgentMemoryType  = 'none' | 'short_term' | 'long_term';

export interface AgentTool {
  name: string;        // e.g. 'web_search', 'code_exec', 'send_email'
  description: string; // What this tool does
  enabled: boolean;    // Whether it is active for this role
}

export interface AgentRoleDefinition {
  name: string;               // e.g. 'CEO', 'Developer'
  commonSkills: string[];     // Skill tags shown on the card

  // ── LLM Runtime Config ──────────────────────
  temperature: number;        // 0.0 (deterministic) → 1.0 (creative). e.g. CFO=0.2, Designer=0.9
  maxTokens: number;          // Max tokens per LLM response. e.g. 512 for support, 4096 for developer
  outputFormat: AgentOutputFormat; // How the agent should format its replies
  memoryType: AgentMemoryType;    // Memory retention strategy

  // ── Tools the role is allowed to invoke ─────
  tools: AgentTool[];

  // ── Default wake-up instruction for heartbeat ─
  heartbeatInstruction?: string;
}

// ─────────────────────────────────────────────
// CONVERSATION MEMORY
// Represents a single turn in the agent's chat history
// ─────────────────────────────────────────────
export type MessageRole = 'system' | 'user' | 'assistant';
export * from './executionLog';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

// ─────────────────────────────────────────────
// ALL PREDEFINED ROLE BLUEPRINTS
// Includes full runtime config per role
// ─────────────────────────────────────────────
export const AGENT_ROLE_BLUEPRINTS: AgentRoleDefinition[] = [
  {
    name: 'CEO',
    commonSkills: ['Strategic Planning', 'Leadership', 'Decision Making', 'Stakeholder Management', 'Vision Setting'],
    temperature: 0.5,
    maxTokens: 2048,
    outputFormat: 'markdown',
    memoryType: 'long_term',
    heartbeatInstruction: 'Assess overall organisational health across all subsidiaries. Flag any critical decisions pending, summarise top 3 strategic priorities, and issue any necessary directives to subordinate agents.',
    tools: [
      { name: 'read_reports',   description: 'Read financial and operational reports', enabled: true },
      { name: 'send_directive', description: 'Issue directives to subordinate agents', enabled: true },
      { name: 'web_search',     description: 'Search the web for market intelligence', enabled: true },
    ],
  },
  {
    name: 'CFO',
    commonSkills: ['Financial Analysis', 'Budget Allocation', 'Risk Assessment', 'Cost Optimization', 'Forecasting'],
    temperature: 0.2,
    maxTokens: 1024,
    outputFormat: 'json',
    memoryType: 'long_term',
    heartbeatInstruction: 'Review current financial positions across all subsidiaries. Flag any budget overruns or cash-flow risks. Generate a brief financial health snapshot in JSON format and alert the CEO of any critical anomalies.',
    tools: [
      { name: 'read_ledger',    description: 'Access the subsidiary financial ledger',  enabled: true },
      { name: 'generate_report',description: 'Generate formatted financial reports',     enabled: true },
      { name: 'alert_ceo',      description: 'Send budget alerts to the CEO',           enabled: true },
    ],
  },
  {
    name: 'CTO',
    commonSkills: ['System Architecture', 'AI/ML Pipelines', 'DevOps', 'Code Review', 'Tech Strategy'],
    temperature: 0.3,
    maxTokens: 4096,
    outputFormat: 'code',
    memoryType: 'short_term',
    heartbeatInstruction: 'Scan for pending technical debt, infrastructure anomalies, and open deployment issues. Summarise current system health in code/markdown format and recommend one priority action for the next development cycle.',
    tools: [
      { name: 'code_exec',      description: 'Execute code in a sandboxed runtime',     enabled: true },
      { name: 'read_codebase',  description: 'Read source files from the repository',   enabled: true },
      { name: 'deploy_service', description: 'Trigger CI/CD deployment pipeline',       enabled: false },
      { name: 'web_search',     description: 'Search docs and Stack Overflow',          enabled: true },
    ],
  },
  {
    name: 'CMO',
    commonSkills: ['Brand Strategy', 'Growth Marketing', 'Campaign Management', 'SEO/SEM', 'Audience Analytics'],
    temperature: 0.7,
    maxTokens: 2048,
    outputFormat: 'markdown',
    memoryType: 'short_term',
    heartbeatInstruction: 'Review all active marketing campaigns and audience engagement metrics. Highlight the top-performing channel, identify one underperforming area, and propose a concrete growth action for the next cycle.',
    tools: [
      { name: 'web_search',     description: 'Research trends and competitor activity', enabled: true },
      { name: 'generate_copy',  description: 'Generate ad/content copy',                enabled: true },
      { name: 'send_email',     description: 'Send campaign emails',                    enabled: false },
    ],
  },
  {
    name: 'Product Manager',
    commonSkills: ['Roadmap Planning', 'User Research', 'Sprint Management', 'Backlog Grooming', 'OKR Setting'],
    temperature: 0.5,
    maxTokens: 2048,
    outputFormat: 'markdown',
    memoryType: 'long_term',
    heartbeatInstruction: 'Groom the product backlog: re-prioritise the top 5 tasks, flag any blocked user stories, and confirm sprint alignment with current OKRs. Provide a concise backlog health report.',
    tools: [
      { name: 'read_backlog',   description: 'Read and prioritize the task backlog',    enabled: true },
      { name: 'write_spec',     description: 'Write user story or feature specification',enabled: true },
      { name: 'web_search',     description: 'Research competitors and user feedback',   enabled: true },
    ],
  },
  {
    name: 'Developer',
    commonSkills: ['Full-Stack Development', 'API Design', 'Unit Testing', 'CI/CD', 'Database Optimization'],
    temperature: 0.2,
    maxTokens: 8192,
    outputFormat: 'code',
    memoryType: 'short_term',
    heartbeatInstruction: 'Run a self-diagnostic: review any open pull requests or code review items in your context, check for failing tests, and report your current development status. Propose the single most impactful next coding action.',
    tools: [
      { name: 'code_exec',      description: 'Execute code in a sandboxed runtime',     enabled: true },
      { name: 'read_codebase',  description: 'Read files from the project repository',  enabled: true },
      { name: 'write_file',     description: 'Write or patch source files',             enabled: true },
      { name: 'web_search',     description: 'Search documentation and GitHub issues',  enabled: true },
      { name: 'run_tests',      description: 'Run automated test suites',               enabled: true },
    ],
  },
  {
    name: 'UI Designer',
    commonSkills: ['UI/UX Design', 'Figma Prototyping', 'Design Systems', 'Accessibility', 'Animation'],
    temperature: 0.9,
    maxTokens: 2048,
    outputFormat: 'markdown',
    memoryType: 'none',
    heartbeatInstruction: 'Review recent design deliverables and assess consistency with the design system. Highlight any accessibility or visual-hierarchy issues, and generate one concrete design improvement suggestion for the current UI.',
    tools: [
      { name: 'generate_image', description: 'Generate UI mockup images via AI',       enabled: true },
      { name: 'web_search',     description: 'Search design inspiration and libraries', enabled: true },
      { name: 'write_file',     description: 'Write CSS / component files',             enabled: false },
    ],
  },
  {
    name: 'Marketer',
    commonSkills: ['Content Creation', 'Social Media', 'Email Campaigns', 'Copywriting', 'A/B Testing'],
    temperature: 0.8,
    maxTokens: 1024,
    outputFormat: 'plain',
    memoryType: 'none',
    heartbeatInstruction: 'Review the content calendar status and latest campaign performance. Assess what content is working well, identify gaps, and draft one fresh content idea that aligns with current audience trends.',
    tools: [
      { name: 'generate_copy',  description: 'Write marketing copy',                   enabled: true },
      { name: 'web_search',     description: 'Research trends and keywords',            enabled: true },
      { name: 'send_email',     description: 'Send newsletter or campaign emails',      enabled: false },
    ],
  },
  {
    name: 'QA Engineer',
    commonSkills: ['Test Automation', 'Regression Testing', 'Bug Reporting', 'Performance Testing', 'API Testing'],
    temperature: 0.1,
    maxTokens: 4096,
    outputFormat: 'json',
    memoryType: 'short_term',
    heartbeatInstruction: 'Run a regression sweep on recent code changes. Report any newly discovered bugs as structured JSON, verify test-suite coverage percentage, and flag any high-risk code paths that need immediate review.',
    tools: [
      { name: 'run_tests',      description: 'Execute automated test suites',           enabled: true },
      { name: 'read_codebase',  description: 'Inspect source code for issues',          enabled: true },
      { name: 'file_bug',       description: 'File a bug report in the tracker',        enabled: true },
      { name: 'code_exec',      description: 'Run scripts for performance profiling',   enabled: true },
    ],
  },
  {
    name: 'Customer Support',
    commonSkills: ['Ticket Resolution', 'Knowledge Base', 'SLA Management', 'Customer Empathy', 'Escalation Handling'],
    temperature: 0.4,
    maxTokens: 512,
    outputFormat: 'plain',
    memoryType: 'short_term',
    heartbeatInstruction: 'Check for any unresolved or escalated support tickets. Summarise open issues, assess SLA compliance status, and flag any tickets that require immediate human escalation or a knowledge-base update.',
    tools: [
      { name: 'read_kb',        description: 'Read knowledge base articles',            enabled: true },
      { name: 'send_email',     description: 'Reply to customer tickets via email',     enabled: true },
      { name: 'escalate',       description: 'Escalate unresolved tickets to a human', enabled: true },
    ],
  },
];

// Legacy string union kept for backward-compatibility
export type AgentRole = 'CEO' | 'CFO' | 'CTO' | 'CMO' | 'Product Manager' | 'Developer' | 'UI Designer' | 'Marketer' | 'QA Engineer' | 'Customer Support';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'resting';

// ─────────────────────────────────────────────
// AGENT — represents a single AI agent instance
// ─────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  roleDefinition: AgentRoleDefinition; // Full role config (skills, tools, LLM settings)
  instructions: string;                // System prompt — behavioral contract for the LLM
  modelId: string;                     // LLM model identifier e.g. 'gemini-2.0-flash'
  subsidiaryId: string;
  status: AgentStatus;
  activeTaskId?: string;
  avatar: string;
  level: number;
  efficiency: number;                  // 0.5–1.5 task speed multiplier
  conversationHistory: ConversationMessage[]; // Running memory of past turns

  // ── Autonomous Heartbeat ───────────────────────────────────────────────────
  heartbeatEnabled: boolean;           // Whether the autonomous pulse is active
  heartbeatIntervalMinutes: number;    // How often the heartbeat fires (1–1440 min)
  heartbeatInstruction: string;        // Instruction given to the agent on each wake-up
  nextHeartbeatAt?: string | null;     // UTC ISO-8601 — when the next pulse fires
  lastHeartbeatAt?: string | null;     // UTC ISO-8601 — when the last pulse fired
}

// ── Heartbeat Log ────────────────────────────────────────────────────────────
export interface HeartbeatLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;     // UTC ISO-8601
  instruction: string;
  response: string;
  success: boolean;
  errorMessage?: string | null;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked_on_user' | string;

export interface TaskDiscussionMessage {
  role: string; // 'user' | 'agent' | 'system'
  content: string;
  timestamp: string;
  senderName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string;
  subsidiaryId: string;
  status: TaskStatus;
  progress: number;   // 0 to 100
  duration: number;   // total steps to complete
  logs: string[];     // agent thoughts or progression updates
  output?: string;    // task result or final action evaluation
  pendingQuestion?: string;
  pendingAnswer?: string;
  discussion?: TaskDiscussionMessage[];
}

export type LogType = 'info' | 'success' | 'warning' | 'agent_action' | 'system';

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
  subsidiaryName?: string;
  agentName?: string;
}

export interface Transaction {
  id: string;
  subsidiaryId: string;
  subsidiaryName: string;
  type: 'Investment' | 'Expense' | 'Profit' | 'Procurement' | 'Sale';
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  amountPaidOrReceived: number;
  description: string;
  timestamp: string;
  referenceNumber: string;
  partnerName: string;
  documentUrl: string;
  processedByAgentId: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

// ─────────────────────────────────────────────
// CRM: Lead & Follow-Up Pipeline
// ─────────────────────────────────────────────
export interface LeadFollowUp {
  date: string;
  note: string;
  createdBy: string;
}

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
export type LeadSource = 'Inbound' | 'Outbound' | 'Referral' | 'Campaign';

export interface Lead {
  id: string;
  subsidiaryId: string;
  subsidiaryName: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  estimatedValue: number;
  assignedToId: string;
  assignedToName: string;
  notes: string;
  followUps: LeadFollowUp[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// EMPLOYEE — Non-Agent Human Staff
// ─────────────────────────────────────────────
export type EmployeeStatus = 'Active' | 'On Leave' | 'Resigned';

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  subsidiaryId: string;
  subsidiaryName: string;
  email: string;
  phone: string;
  salary: number;
  joinDate: string;
  status: EmployeeStatus;
  reportsToId: string;
  reportsToName: string;
  avatar: string;
}

// ─────────────────────────────────────────────
// PRODUCT CATALOG ITEM
// ─────────────────────────────────────────────
export interface CatalogItem {
  id: string;
  productName: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  subsidiaryId: string;
  subsidiaryName: string;
}

// ─────────────────────────────────────────────
// DYNAMIC ROLE BLUEPRINT
// ─────────────────────────────────────────────
export interface RoleBlueprint {
  id: string;
  name: string;
  commonSkills: string[];
  temperature: number;
  maxTokens: number;
  outputFormat: AgentOutputFormat;
  memoryType: AgentMemoryType;
  tools: AgentTool[];
  heartbeatInstruction?: string;
}

// ─────────────────────────────────────────────
// HELPER: default heartbeat instruction by role
// ─────────────────────────────────────────────
const FALLBACK_HEARTBEAT_INSTRUCTION =
  'Perform a routine self-status check for your role. Report your current operational readiness, highlight any blockers, and propose one proactive action.';

export function getDefaultHeartbeatInstruction(role: string): string {
  const blueprint = AGENT_ROLE_BLUEPRINTS.find(
    b => b.name.toLowerCase() === role.toLowerCase()
  );
  return blueprint?.heartbeatInstruction ?? FALLBACK_HEARTBEAT_INSTRUCTION;
}

// ─────────────────────────────────────────────
// TEAM CHAT (Group Chat)
// ─────────────────────────────────────────────
export interface GroupChat {
  id: string;
  name: string;
  participantIds: string[];
  createdAt: string;
}

export interface GroupChatMessage {
  id: string;
  groupChatId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'agent' | 'employee';
  content: string;
  timestamp: string;
}

// ─────────────────────────────────────────────
// MEMORY BOOK
// ─────────────────────────────────────────────
export type MemoryCategory =
  | 'preference'
  | 'project'
  | 'goal'
  | 'lesson'
  | 'decision'
  | 'fact'
  | 'person'
  | 'company';

export type MemorySource = 'agent' | 'user' | 'heartbeat' | 'task';

export interface MemoryEntry {
  id: string;
  /** agentId for agent-owned entries, "global" for company-wide */
  ownerId: string;
  /** Display name of the owner */
  ownerName: string;
  /**
   * Visibility scope:
   *   "global"      → all agents
   *   role name     → agents of that role
   *   subsidiaryId  → agents in that subsidiary
   *   agentId       → private to one agent
   */
  audience: string;
  category: MemoryCategory;
  /** Short label / headline */
  key: string;
  /** Full memory content */
  value: string;
  source: MemorySource;
  pinned: boolean;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}
