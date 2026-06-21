export interface Subsidiary {
  id: string;
  name: string;
  industry: string;
  investment: number;
  balance: number;
  expenses: number;
  profits: number;
  color: string; // Tailind gradient color class or hex (e.g. 'from-purple-500 to-indigo-600')
  borderColor: string; // Tailwind border color class (e.g. 'border-purple-500/30')
  textColor: string; // Tailwind text color class (e.g. 'text-purple-400')
  icon: string; // Lucide icon name
}

export type AgentRole = 'CEO' | 'CFO' | 'CTO' | 'CMO' | 'Product Manager' | 'Developer' | 'UI Designer' | 'Marketer' | 'QA Engineer' | 'Customer Support';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'resting';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  subsidiaryId: string;
  status: AgentStatus;
  activeTaskId?: string;
  avatar: string; // URL or emoji/initials representation
  level: number;
  efficiency: number; // 0.5 to 1.5 multiplier
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgentId: string;
  subsidiaryId: string;
  status: TaskStatus;
  progress: number; // 0 to 100
  payout: number; // profit generated on complete
  cost: number; // expense incurred during creation/run
  duration: number; // total steps to complete
  logs: string[]; // agent thoughts or progression updates
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
