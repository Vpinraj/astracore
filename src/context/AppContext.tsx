import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Subsidiary, Agent, Task, ActivityLog, AgentRole, LogType } from '../types';

interface AppContextType {
  subsidiaries: Subsidiary[];
  agents: Agent[];
  tasks: Task[];
  logs: ActivityLog[];
  createSubsidiary: (name: string, industry: string, investment: number, colorTheme?: string) => Subsidiary;
  createAgent: (name: string, role: AgentRole, subsidiaryId: string) => Agent;
  createTask: (title: string, description: string, subsidiaryId: string, assignedAgentId: string, payout: number, cost: number) => Task;
  allocateFunds: (subsidiaryId: string, amount: number) => void;
  startTask: (taskId: string) => void;
  parseDirectorCommand: (command: string) => Promise<{ success: boolean; text: string }>;
  clearLogs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper names & industries
const INDUSTRIES = ['AI Software', 'Robotics', 'Fintech', 'Creative Agency', 'Biotech', 'Cybersecurity'];
const COLORS = [
  { color: 'from-purple-600 to-indigo-600', border: 'border-purple-500/30', text: 'text-purple-400' },
  { color: 'from-blue-600 to-cyan-600', border: 'border-blue-500/30', text: 'text-blue-400' },
  { color: 'from-emerald-600 to-teal-600', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  { color: 'from-amber-500 to-orange-600', border: 'border-amber-500/30', text: 'text-amber-400' },
  { color: 'from-rose-600 to-pink-600', border: 'border-rose-500/30', text: 'text-rose-400' },
];

const AGENT_THOUGHTS: Record<AgentRole, string[]> = {
  'CEO': [
    'Refining organizational roadmap...',
    'Reviewing quarterly metrics and agent efficiency...',
    'Drafting partnership proposals with external APIs...',
    'Strategizing long-term investment vectors...',
    'Evaluating subsidiary contribution metrics...'
  ],
  'CFO': [
    'Balancing the ledger and tracking server costs...',
    'Auditing token spend and operational overhead...',
    'Drafting financial summaries for the Director...',
    'Optimizing capital allocation across active projects...',
    'Forecasting profit margins and task yield rates...'
  ],
  'CTO': [
    'Reviewing system architecture parameters...',
    'Optimizing token execution latency...',
    'Configuring agent pipeline standard integrations...',
    'Assessing tech debt in AI code generators...',
    'Refining data storage protocols for high throughput...'
  ],
  'CMO': [
    'Analyzing audience acquisition metrics...',
    'Drafting content calendar and agent promotional campaigns...',
    'A/B testing user engagement copy...',
    'Structuring brand positioning guidelines...',
    'Optimizing SEO keywords and referral loops...'
  ],
  'Product Manager': [
    'Mapping user stories to development sprints...',
    'Prioritizing feature backlog based on ROI projections...',
    'Conducting competitor dashboard reviews...',
    'Defining acceptance criteria for pending milestones...',
    'Synthesizing feedback from customer agent logs...'
  ],
  'Developer': [
    'Refactoring API route handlers...',
    'Writing unit tests for agent execution queues...',
    'Debugging concurrent state updates...',
    'Optimizing SQL queries and caching layer...',
    'Deploying hotfixes to serverless containers...'
  ],
  'UI Designer': [
    'Polishing glassmorphic layout tokens...',
    'Designing glowing button states and active hover micro-interactions...',
    'Creating high-fidelity vector layouts for the client portal...',
    'Optimizing visual hierarchy and loading skeletons...',
    'Establishing cohesive typography scale...'
  ],
  'Marketer': [
    'Writing newsletter copy for product updates...',
    'Monitoring click-through ratios on active channels...',
    'Setting up keyword campaigns for AI integration tools...',
    'Curating community showcase threads...',
    'Engaging target audiences on social forums...'
  ],
  'QA Engineer': [
    'Executing end-to-end integration test suites...',
    'Writing regression tests for the chat processor...',
    'Conducting performance stress tests on database clusters...',
    'Filing bug tickets for styling inconsistencies...',
    'Verifying API response contracts...'
  ],
  'Customer Support': [
    'Resolving user ticketing logs...',
    'Drafting knowledge base articles for setup anomalies...',
    'Triage of incident reports from active client nodes...',
    'Synthesizing customer satisfaction indexes...',
    'Following up on service SLA escalations...'
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial Mock Data
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([
    {
      id: 'sub-1',
      name: 'CyberCore AI',
      industry: 'AI Software',
      investment: 150000,
      balance: 165000,
      expenses: 25000,
      profits: 40000,
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      icon: 'Cpu'
    },
    {
      id: 'sub-2',
      name: 'Nexus Media',
      industry: 'Creative Agency',
      investment: 100000,
      balance: 90000,
      expenses: 15000,
      profits: 5000,
      color: 'from-blue-600 to-cyan-600',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      icon: 'Palette'
    }
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent-1',
      name: 'Ada Lovelace',
      role: 'CEO',
      subsidiaryId: 'sub-1',
      status: 'idle',
      avatar: '👩‍💼',
      level: 4,
      efficiency: 1.25
    },
    {
      id: 'agent-2',
      name: 'Alan Turing',
      role: 'CTO',
      subsidiaryId: 'sub-1',
      status: 'working',
      activeTaskId: 'task-1',
      avatar: '👨‍💻',
      level: 5,
      efficiency: 1.4
    },
    {
      id: 'agent-3',
      name: 'Claude Shannon',
      role: 'CMO',
      subsidiaryId: 'sub-2',
      status: 'working',
      activeTaskId: 'task-2',
      avatar: '👨‍💼',
      level: 3,
      efficiency: 1.05
    },
    {
      id: 'agent-4',
      name: 'Grace Hopper',
      role: 'CFO',
      subsidiaryId: 'sub-2',
      status: 'idle',
      avatar: '👩‍💻',
      level: 4,
      efficiency: 1.15
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-1',
      title: 'Train LLM Foundation Model',
      description: 'Optimize transformer weights on pre-training datasets to increase model precision.',
      assignedAgentId: 'agent-2',
      subsidiaryId: 'sub-1',
      status: 'in_progress',
      progress: 45,
      payout: 45000,
      cost: 8000,
      duration: 20,
      logs: ['Initialized training nodes...', 'Loading pre-training tensor weight graphs...']
    },
    {
      id: 'task-2',
      title: 'Launch viral campaign',
      description: 'Design and deploy programmatic ads targeting tech builders and creators.',
      assignedAgentId: 'agent-3',
      subsidiaryId: 'sub-2',
      status: 'in_progress',
      progress: 75,
      payout: 25000,
      cost: 3000,
      duration: 15,
      logs: ['Scraping trends...', 'Optimizing target keywords...']
    }
  ]);

  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      message: 'CyberCore AI subsidiary initialized with $150,000 initial investment.',
      type: 'info',
      subsidiaryName: 'CyberCore AI'
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Nexus Media subsidiary initialized with $100,000 initial investment.',
      type: 'info',
      subsidiaryName: 'Nexus Media'
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      message: 'CTO Alan Turing started task: Train LLM Foundation Model.',
      type: 'agent_action',
      subsidiaryName: 'CyberCore AI',
      agentName: 'Alan Turing'
    },
    {
      id: 'log-4',
      timestamp: new Date().toLocaleTimeString(),
      message: 'CMO Claude Shannon started task: Launch viral campaign.',
      type: 'agent_action',
      subsidiaryName: 'Nexus Media',
      agentName: 'Claude Shannon'
    }
  ]);

  const addLog = useCallback((message: string, type: LogType, subsidiaryName?: string, agentName?: string) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
        subsidiaryName,
        agentName
      },
      ...prev.slice(0, 99) // Limit to 100 logs
    ]);
  }, []);

  const createSubsidiary = (name: string, industry: string, investment: number, colorTheme?: string) => {
    const idx = Math.floor(Math.random() * COLORS.length);
    const chosenTheme = colorTheme ? COLORS.find(c => c.color.includes(colorTheme)) || COLORS[idx] : COLORS[idx];
    const icons = ['Cpu', 'Palette', 'DollarSign', 'Shield', 'Database', 'Activity'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const newSub: Subsidiary = {
      id: `sub-${Date.now()}`,
      name,
      industry,
      investment,
      balance: investment,
      expenses: 0,
      profits: 0,
      color: chosenTheme.color,
      borderColor: chosenTheme.border,
      textColor: chosenTheme.text,
      icon: randomIcon
    };

    setSubsidiaries((prev) => [...prev, newSub]);
    addLog(`Subsidiary "${name}" created in the ${industry} industry with investment of $${investment.toLocaleString()}.`, 'info', name);
    return newSub;
  };

  const createAgent = (name: string, role: AgentRole, subsidiaryId: string) => {
    const sub = subsidiaries.find(s => s.id === subsidiaryId);
    const cost = 2500; // Hiring fee

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name,
      role,
      subsidiaryId,
      status: 'idle',
      avatar: role.includes('Developer') || role.includes('CTO') ? '👨‍💻' : role.includes('CEO') ? '👩‍💼' : role.includes('CFO') ? '👩‍💻' : '🤵',
      level: 1,
      efficiency: parseFloat((0.8 + Math.random() * 0.6).toFixed(2)) // 0.8 - 1.4
    };

    setAgents((prev) => [...prev, newAgent]);

    // deduct hiring cost from subsidiary
    setSubsidiaries((prev) =>
      prev.map((s) =>
        s.id === subsidiaryId
          ? {
              ...s,
              balance: s.balance - cost,
              expenses: s.expenses + cost
            }
          : s
      )
    );

    addLog(`Hired ${role} ${name} under ${sub?.name || 'Subsidiary'}. Server initialization expense: $2,500.`, 'agent_action', sub?.name, name);
    return newAgent;
  };

  const createTask = (
    title: string,
    description: string,
    subsidiaryId: string,
    assignedAgentId: string,
    payout: number,
    cost: number
  ) => {
    const agent = agents.find(a => a.id === assignedAgentId);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      assignedAgentId,
      subsidiaryId,
      status: 'pending',
      progress: 0,
      payout,
      cost,
      duration: 10 + Math.floor(Math.random() * 15),
      logs: ['Task pipeline initialized. Awaiting deployment...']
    };

    setTasks((prev) => [...prev, newTask]);

    if (agent) {
      // automatically start task if agent is idle
      if (agent.status === 'idle') {
        setTimeout(() => startTask(newTask.id), 100);
      }
    }

    return newTask;
  };

  const startTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const agent = agents.find(a => a.id === t.assignedAgentId);
          const sub = subsidiaries.find(s => s.id === t.subsidiaryId);

          if (agent && agent.status !== 'idle') {
            return t; // Agent is busy
          }

          // deduct cost immediately
          setSubsidiaries((subPrev) =>
            subPrev.map((s) =>
              s.id === t.subsidiaryId
                ? {
                    ...s,
                    balance: s.balance - t.cost,
                    expenses: s.expenses + t.cost
                  }
                : s
            )
          );

          // update agent status
          setAgents((agentPrev) =>
            agentPrev.map((a) =>
              a.id === t.assignedAgentId
                ? { ...a, status: 'working', activeTaskId: t.id }
                : a
            )
          );

          addLog(
            `Agent ${agent?.name} (${agent?.role}) deployed to task: "${t.title}". Allocated operational budget: $${t.cost.toLocaleString()}.`,
            'agent_action',
            sub?.name,
            agent?.name
          );

          return { ...t, status: 'in_progress', logs: [...t.logs, `Agent started execution. Running processes...`] };
        }
        return t;
      })
    );
  };

  const allocateFunds = (subsidiaryId: string, amount: number) => {
    const sub = subsidiaries.find(s => s.id === subsidiaryId);
    setSubsidiaries((prev) =>
      prev.map((s) =>
        s.id === subsidiaryId
          ? {
              ...s,
              balance: s.balance + amount,
              investment: s.investment + amount
            }
          : s
      )
    );
    addLog(`Allocated $${amount.toLocaleString()} in additional investment funding to ${sub?.name}.`, 'info', sub?.name);
  };

  const clearLogs = () => setLogs([]);

  // SIMULATION TICK ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((currentTasks) => {
        let taskUpdated = false;

        const updated = currentTasks.map((task): Task => {
          if (task.status !== 'in_progress') return task;

          taskUpdated = true;
          const agent = agents.find((a) => a.id === task.assignedAgentId);
          const sub = subsidiaries.find((s) => s.id === task.subsidiaryId);

          if (!agent) return task;

          // calculate step progress based on efficiency
          const baseStep = 6 + Math.random() * 8; // base 6-14%
          const step = Math.min(100 - task.progress, Math.round(baseStep * agent.efficiency));
          const newProgress = task.progress + step;

          // pick a random thought
          const roleThoughts = AGENT_THOUGHTS[agent.role] || ['Processing steps...', 'Refining data structures...'];
          const randomThought = roleThoughts[Math.floor(Math.random() * roleThoughts.length)];
          const newLogs = [...task.logs];

          if (newProgress < 100 && Math.random() > 0.4) {
            newLogs.push(`${agent.role} ${agent.name}: ${randomThought}`);
            // add to global logs occasionally
            if (Math.random() > 0.7) {
              addLog(`${agent.name} is working on "${task.title}": ${randomThought}`, 'agent_action', sub?.name, agent.name);
            }
          }

          if (newProgress >= 100) {
            // Task is completed!
            newLogs.push(`Task completed! Revenue payload generated: $${task.payout.toLocaleString()}`);

            // Update subsidiary finances
            setSubsidiaries((prevSubs) =>
              prevSubs.map((s) =>
                s.id === task.subsidiaryId
                  ? {
                      ...s,
                      balance: s.balance + task.payout,
                      profits: s.profits + task.payout
                    }
                  : s
              )
            );

            // Set agent to idle
            setAgents((prevAgents) =>
              prevAgents.map((a) =>
                a.id === task.assignedAgentId
                  ? { ...a, status: 'idle', activeTaskId: undefined, level: a.level + 1 }
                  : a
              )
            );

            addLog(
              `SUCCESS: ${agent.name} (${agent.role}) completed "${task.title}". Generated $${task.payout.toLocaleString()} in profit for ${sub?.name}!`,
              'success',
              sub?.name,
              agent.name
            );

            return {
              ...task,
              progress: 100,
              status: 'completed',
              logs: newLogs
            };
          }

          return {
            ...task,
            progress: newProgress,
            logs: newLogs
          };
        });

        return taskUpdated ? updated : currentTasks;
      });
    }, 3500); // Trigger every 3.5 seconds

    return () => clearInterval(interval);
  }, [agents, subsidiaries, addLog]);

  // NATURAL LANGUAGE COMMAND INTERPRETER FOR THE DIRECTOR AGENT
  const parseDirectorCommand = async (command: string): Promise<{ success: boolean; text: string }> => {
    const textClean = command.toLowerCase().trim();

    // 1. CREATE SUBSIDIARY
    // Matches: "create subsidiary [name] with [investment]" or "create subsidiary [name] with $[investment]"
    const createSubRegex = /create\s+subsidiary\s+([a-zA-Z0-9\s]+?)\s+with\s+(?:\$)?(\d+)/i;
    const createSubMatch = textClean.match(createSubRegex);
    if (createSubMatch) {
      const name = createSubMatch[1].trim();
      const funds = parseInt(createSubMatch[2]);
      if (isNaN(funds) || funds <= 0) {
        return { success: false, text: "I couldn't understand the investment amount. Please specify a positive number." };
      }

      // capitalize name properly
      const formattedName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const newSub = createSubsidiary(formattedName, INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)], funds);
      return {
        success: true,
        text: `Understood. I have initialized a new subsidiary named "${newSub.name}" in the ${newSub.industry} sector with $${funds.toLocaleString()} in seed capital.`
      };
    }

    // 2. HIRE AGENT / CREATE AGENT
    // Matches: "hire [role] named [name] for [subsidiary]" or "create agent [role] named [name] for [subsidiary]"
    const hireAgentRegex = /(?:hire|create\s+agent)\s+([a-zA-Z\s]+?)\s+named\s+([a-zA-Z\s]+?)\s+for\s+([a-zA-Z0-9\s]+)/i;
    const hireAgentMatch = textClean.match(hireAgentRegex);
    if (hireAgentMatch) {
      const rawRole = hireAgentMatch[1].trim();
      const name = hireAgentMatch[2].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const subQuery = hireAgentMatch[3].trim().toLowerCase();

      // Find role matching
      const roles: AgentRole[] = ['CEO', 'CFO', 'CTO', 'CMO', 'Product Manager', 'Developer', 'UI Designer', 'Marketer', 'QA Engineer', 'Customer Support'];
      const matchedRole = roles.find(r => r.toLowerCase() === rawRole.toLowerCase()) || 
                          roles.find(r => r.toLowerCase().includes(rawRole.toLowerCase()));

      if (!matchedRole) {
        return {
          success: false,
          text: `I couldn't identify the role "${rawRole}". Available roles include CEO, CFO, CTO, Developer, UI Designer, Marketer, or Customer Support.`
        };
      }

      // Find subsidiary matching
      const sub = subsidiaries.find(s => s.name.toLowerCase() === subQuery || s.name.toLowerCase().includes(subQuery));
      if (!sub) {
        return { success: false, text: `I couldn't find a subsidiary matching "${subQuery}". Please double check your subsidiary names.` };
      }

      if (sub.balance < 2500) {
        return { success: false, text: `Insufficient funds in ${sub.name} (Balance: $${sub.balance.toLocaleString()}). Server hiring fee is $2,500.` };
      }

      const agent = createAgent(name, matchedRole, sub.id);
      return {
        success: true,
        text: `Confirmed. I have deployed ${agent.role} ${agent.name} to the "${sub.name}" network node.`
      };
    }

    // 3. ALLOCATE FUNDS
    // Matches: "allocate [amount] to [subsidiary]" or "give [amount] to [subsidiary]" or "invest [amount] in [subsidiary]"
    const fundRegex = /(?:allocate|give|invest)\s+(?:\$)?(\d+)\s+to\s+([a-zA-Z0-9\s]+)/i;
    const fundMatch = textClean.match(fundRegex);
    if (fundMatch) {
      const amount = parseInt(fundMatch[1]);
      const subQuery = fundMatch[2].trim().toLowerCase();

      if (isNaN(amount) || amount <= 0) {
        return { success: false, text: "Please specify a positive funding amount." };
      }

      const sub = subsidiaries.find(s => s.name.toLowerCase() === subQuery || s.name.toLowerCase().includes(subQuery));
      if (!sub) {
        return { success: false, text: `I couldn't find a subsidiary named "${subQuery}" to credit.` };
      }

      allocateFunds(sub.id, amount);
      return {
        success: true,
        text: `Funds transferred. Deposited $${amount.toLocaleString()} of parent company investment capital to ${sub.name}.`
      };
    }

    // 4. ASSIGN TASK
    // Matches: "assign task [title] to [agent_name]" or "assign [title] to [agent_name]"
    const assignRegex = /assign\s+(?:task\s+)?([a-zA-Z0-9\s]+?)\s+to\s+([a-zA-Z\s]+)/i;
    const assignMatch = textClean.match(assignRegex);
    if (assignMatch) {
      const taskTitle = assignMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const agentQuery = assignMatch[2].trim().toLowerCase();

      const agent = agents.find(a => a.name.toLowerCase() === agentQuery || a.name.toLowerCase().includes(agentQuery));
      if (!agent) {
        return { success: false, text: `I couldn't find an AI agent matching the name "${agentQuery}".` };
      }

      if (agent.status !== 'idle') {
        return { success: false, text: `${agent.name} is currently busy working on another node stream.` };
      }

      const sub = subsidiaries.find(s => s.id === agent.subsidiaryId);
      if (!sub) {
        return { success: false, text: `System configuration error: Agent's subsidiary reference is missing.` };
      }

      const taskCost = Math.round(1500 + Math.random() * 2000);
      const taskPayout = Math.round(taskCost * (2 + Math.random() * 3)); // 2x to 5x return

      if (sub.balance < taskCost) {
        return { success: false, text: `Insufficient funds in ${sub.name} ($${sub.balance.toLocaleString()}) to deploy this task (Requires $${taskCost.toLocaleString()}).` };
      }

      const task = createTask(
        taskTitle,
        `Task assigned by Director command: ${taskTitle}.`,
        sub.id,
        agent.id,
        taskPayout,
        taskCost
      );

      return {
        success: true,
        text: `Task dispatch completed. Assigned "${task.title}" to ${agent.role} ${agent.name}. Operational costs: $${task.cost.toLocaleString()}. Projected yields: $${task.payout.toLocaleString()}.`
      };
    }

    // 5. STATUS OF SUBSIDIARY
    // Matches: "status of [subsidiary]" or "how is [subsidiary] doing"
    if (textClean.includes('status of') || textClean.includes('how is')) {
      const subQuery = textClean.replace('status of', '').replace('how is', '').replace('doing', '').replace('performing', '').trim();
      const sub = subsidiaries.find(s => s.name.toLowerCase() === subQuery || s.name.toLowerCase().includes(subQuery));

      if (sub) {
        const subAgents = agents.filter(a => a.subsidiaryId === sub.id);
        const activeTasks = tasks.filter(t => t.subsidiaryId === sub.id && t.status === 'in_progress');
        return {
          success: true,
          text: `${sub.name} metrics: Seed Investment is $${sub.investment.toLocaleString()}, Operating Balance is $${sub.balance.toLocaleString()}, with total profits of $${sub.profits.toLocaleString()} and expenses of $${sub.expenses.toLocaleString()}. There are currently ${subAgents.length} agents deployed, with ${activeTasks.length} tasks running.`
        };
      }
    }

    // 6. GENERAL STATUS
    if (textClean.includes('status') || textClean.includes('summary') || textClean.includes('overall') || textClean.includes('hello') || textClean.includes('hi ')) {
      const totalInvestments = subsidiaries.reduce((sum, s) => sum + s.investment, 0);
      const totalExpenses = subsidiaries.reduce((sum, s) => sum + s.expenses, 0);
      const totalProfits = subsidiaries.reduce((sum, s) => sum + s.profits, 0);
      const activeCount = agents.filter(a => a.status === 'working').length;

      return {
        success: true,
        text: `Hello Director. The parent enterprise is operating stably. Total network investments: $${totalInvestments.toLocaleString()}. Total operating expenses: $${totalExpenses.toLocaleString()}. Accumulated agent profits: $${totalProfits.toLocaleString()}. There are ${activeCount} AI agents actively running workflows across ${subsidiaries.length} subsidiaries. Let me know if you would like me to hire agents, allocate capital, or dispatch tasks.`
      };
    }

    // Fallback if not matched
    return {
      success: false,
      text: "I couldn't process that directive. You can issue commands such as: 'create subsidiary [Name] with [Amount]', 'hire Developer named [Name] for [Subsidiary]', 'allocate [Amount] to [Subsidiary]', or 'assign task [Task Title] to [Agent Name]'."
    };
  };

  return (
    <AppContext.Provider
      value={{
        subsidiaries,
        agents,
        tasks,
        logs,
        createSubsidiary,
        createAgent,
        createTask,
        allocateFunds,
        startTask,
        parseDirectorCommand,
        clearLogs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
