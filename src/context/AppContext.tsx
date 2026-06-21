import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Subsidiary, Agent, Task, ActivityLog, AgentRole, AgentRoleDefinition, Transaction, Lead, Employee } from '../types';
import { AGENT_ROLE_BLUEPRINTS } from '../types';

interface AppContextType {
  subsidiaries: Subsidiary[];
  agents: Agent[];
  tasks: Task[];
  logs: ActivityLog[];
  transactions: Transaction[];
  leads: Lead[];
  employees: Employee[];
  createSubsidiary: (
    name: string, 
    industry: string, 
    investment: number, 
    colorTheme?: string,
    logoUrl?: string,
    website?: string,
    email?: string,
    phone?: string,
    description?: string,
    address?: string,
    bankDetails?: string
  ) => Promise<Subsidiary>;
  createAgent: (
    name: string, 
    role: AgentRole, 
    subsidiaryId: string, 
    instructions?: string, 
    modelId?: string, 
    customOverrides?: Partial<AgentRoleDefinition>,
    deductionFee?: number
  ) => Promise<Agent>;
  createTask: (title: string, description: string, subsidiaryId: string, assignedAgentId: string, payout: number, cost: number) => Promise<Task>;
  assignAgentToTask: (taskId: string, agentId: string) => Promise<void>;
  allocateFunds: (subsidiaryId: string, amount: number) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  parseDirectorCommand: (command: string) => Promise<{ success: boolean; text: string }>;
  clearLogs: () => Promise<void>;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: Date | null;
  resetState: () => Promise<void>;
  createTransaction: (
    subsidiaryId: string,
    type: string,
    subtotal: number,
    discount: number,
    cgst: number,
    sgst: number,
    totalAmount: number,
    amountPaidOrReceived: number,
    description: string,
    referenceNumber?: string,
    partnerName?: string,
    documentUrl?: string,
    processedByAgentId?: string,
    status?: string
  ) => Promise<void>;
  createLead: (
    subsidiaryId: string,
    contactName: string,
    companyName: string,
    email?: string,
    phone?: string,
    source?: string,
    stage?: string,
    estimatedValue?: number,
    assignedToId?: string,
    assignedToName?: string,
    notes?: string
  ) => Promise<Lead>;
  updateLeadStage: (leadId: string, stage: string, followUpNote?: string, createdBy?: string) => Promise<Lead>;
  deleteLead: (leadId: string) => Promise<void>;
  createEmployee: (
    name: string,
    designation: string,
    department: string,
    subsidiaryId: string,
    email?: string,
    phone?: string,
    salary?: number,
    joinDate?: string,
    reportsToId?: string,
    reportsToName?: string,
    avatar?: string,
    status?: string
  ) => Promise<Employee>;
  deleteEmployee: (employeeId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5035/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Initial Mock Data (used as fallback)
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
      roleDefinition: AGENT_ROLE_BLUEPRINTS.find(r => r.name === 'CEO')!,
      instructions: 'You are the CEO of CyberCore AI.',
      modelId: 'gemini-2.0-flash',
      subsidiaryId: 'sub-1',
      status: 'idle',
      avatar: '👩‍💼',
      level: 4,
      efficiency: 1.25,
      conversationHistory: []
    },
    {
      id: 'agent-2',
      name: 'Alan Turing',
      role: 'CTO',
      roleDefinition: AGENT_ROLE_BLUEPRINTS.find(r => r.name === 'CTO')!,
      instructions: 'You are the CTO of CyberCore AI.',
      modelId: 'gemini-2.0-flash',
      subsidiaryId: 'sub-1',
      status: 'working',
      activeTaskId: 'task-1',
      avatar: '👨‍💻',
      level: 5,
      efficiency: 1.4,
      conversationHistory: []
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const applyStateData = (data: any) => {
    setSubsidiaries(data.subsidiaries || []);
    setAgents(data.agents || []);
    setTasks(data.tasks || []);
    setLogs(data.logs || []);
    setTransactions(data.transactions || []);
    setLeads(data.leads || []);
    setEmployees(data.employees || []);
    setLastSyncedAt(new Date());
  };

  // Fetch initial state from API
  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/state`);
        if (response.ok) {
          const data = await response.json();
          applyStateData(data);
        } else {
          setSyncError("Failed to fetch state from backend API");
        }
      } catch (err) {
        console.error("Failed to load state from .NET API:", err);
        setSyncError("Unable to connect to the backend server");
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  const reloadState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/state`);
      if (response.ok) {
        const data = await response.json();
        applyStateData(data);
      }
    } catch (err) {
      console.error("Failed to reload state:", err);
      setSyncError("Error reloading state");
    }
  }, []);

  // Reset/Reseed Database State
  const resetState = async () => {
    setIsLoading(true);
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/reset`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        applyStateData(data);
        // Also reload leads and employees which come from separate endpoints
        await reloadState();
      } else {
        setSyncError("Failed to reset database");
      }
    } catch (err) {
      console.error("Failed to reset state:", err);
      setSyncError("Error connecting during reset");
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const createSubsidiary = async (
    name: string, 
    industry: string, 
    investment: number, 
    colorTheme?: string,
    logoUrl?: string,
    website?: string,
    email?: string,
    phone?: string,
    description?: string,
    address?: string,
    bankDetails?: string
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/subsidiary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, industry, investment, colorTheme,
          logoUrl, website, email, phone, description, address, bankDetails
        })
      });
      if (!response.ok) throw new Error("Failed to create subsidiary");
      const newSub = await response.json();
      await reloadState();
      return newSub;
    } catch (err: any) {
      setSyncError(err.message || "Failed to create subsidiary");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const createAgent = async (
    name: string,
    role: AgentRole,
    subsidiaryId: string,
    instructions?: string,
    modelId?: string,
    customOverrides?: Partial<AgentRoleDefinition>,
    deductionFee?: number
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, subsidiaryId, instructions, modelId, customOverrides, deductionFee })
      });
      if (!response.ok) throw new Error("Failed to hire agent");
      const newAgent = await response.json();
      await reloadState();
      return newAgent;
    } catch (err: any) {
      setSyncError(err.message || "Failed to hire agent");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const assignAgentToTask = async (taskId: string, agentId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/task/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, agentId })
      });
      if (!response.ok) throw new Error("Failed to assign agent to task");
      await reloadState();
    } catch (err: any) {
      setSyncError(err.message || "Failed to assign agent to task");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const createTask = async (
    title: string, description: string, subsidiaryId: string,
    assignedAgentId: string, payout: number, cost: number
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, subsidiaryId, assignedAgentId, payout, cost })
      });
      if (!response.ok) throw new Error("Failed to create task");
      const newTask = await response.json();
      await reloadState();
      return newTask;
    } catch (err: any) {
      setSyncError(err.message || "Failed to create task");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const startTask = async (taskId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/start-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (!response.ok) throw new Error("Failed to start task");
      await reloadState();
    } catch (err: any) {
      setSyncError(err.message || "Failed to start task");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const allocateFunds = async (subsidiaryId: string, amount: number) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/allocate-funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subsidiaryId, amount })
      });
      if (!response.ok) throw new Error("Failed to allocate funds");
      await reloadState();
    } catch (err: any) {
      setSyncError(err.message || "Failed to allocate funds");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearLogs = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/clear-logs`, { method: 'POST' });
      if (!response.ok) throw new Error("Failed to clear logs");
      await reloadState();
    } catch (err: any) {
      setSyncError(err.message || "Failed to clear logs");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // SIMULATION TICK ENGINE
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/simulation/tick`, { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          applyStateData(data);
        }
      } catch (err) {
        console.error("Failed to tick simulation:", err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // NATURAL LANGUAGE COMMAND INTERPRETER
  const parseDirectorCommand = async (command: string): Promise<{ success: boolean; text: string }> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (!response.ok) throw new Error("Failed to execute director command");
      const data = await response.json();
      if (data.state) applyStateData(data.state);
      return { success: data.success, text: data.text };
    } catch (err: any) {
      setSyncError(err.message || "Failed to execute director command");
      return { success: false, text: "Unable to reach director agent service." };
    } finally {
      setIsSyncing(false);
    }
  };

  const createTransaction = async (
    subsidiaryId: string, type: string, subtotal: number, discount: number,
    cgst: number, sgst: number, totalAmount: number, amountPaidOrReceived: number,
    description: string, referenceNumber?: string, partnerName?: string,
    documentUrl?: string, processedByAgentId?: string, status?: string
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/simulation/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subsidiaryId, type, subtotal, discount, cgst, sgst, totalAmount,
          amountPaidOrReceived, description,
          referenceNumber: referenceNumber || '',
          partnerName: partnerName || '',
          documentUrl: documentUrl || '',
          processedByAgentId: processedByAgentId || '',
          status: status || 'Completed'
        })
      });
      if (!response.ok) throw new Error("Failed to create transaction");
      const data = await response.json();
      applyStateData(data);
    } catch (err: any) {
      setSyncError(err.message || "Failed to create transaction");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── CRM Lead Actions ────────────────────────────────────────────────────
  const createLead = async (
    subsidiaryId: string, contactName: string, companyName: string,
    email = '', phone = '', source = 'Inbound', stage = 'New',
    estimatedValue = 0, assignedToId = '', assignedToName = '', notes = ''
  ): Promise<Lead> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subsidiaryId, contactName, companyName, email, phone, source,
          stage, estimatedValue, assignedToId, assignedToName, notes
        })
      });
      if (!response.ok) throw new Error("Failed to create lead");
      const newLead = await response.json();
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    } catch (err: any) {
      setSyncError(err.message || "Failed to create lead");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateLeadStage = async (
    leadId: string, stage: string, followUpNote = '', createdBy = 'System'
  ): Promise<Lead> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, stage, followUpNote, createdBy })
      });
      if (!response.ok) throw new Error("Failed to update lead stage");
      const updated = await response.json();
      setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
      return updated;
    } catch (err: any) {
      setSyncError(err.message || "Failed to update lead stage");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await fetch(`${API_BASE_URL}/leads/${leadId}`, { method: 'DELETE' });
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err: any) {
      setSyncError(err.message || "Failed to delete lead");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Employee Actions ────────────────────────────────────────────────────
  const createEmployee = async (
    name: string, designation: string, department: string, subsidiaryId: string,
    email = '', phone = '', salary = 0, joinDate = '',
    reportsToId = '', reportsToName = '', avatar = '👤', status = 'Active'
  ): Promise<Employee> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, designation, department, subsidiaryId, email, phone,
          salary, joinDate, reportsToId, reportsToName, avatar, status
        })
      });
      if (!response.ok) throw new Error("Failed to create employee");
      const newEmp = await response.json();
      setEmployees(prev => [...prev, newEmp]);
      return newEmp;
    } catch (err: any) {
      setSyncError(err.message || "Failed to create employee");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await fetch(`${API_BASE_URL}/employees/${employeeId}`, { method: 'DELETE' });
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
    } catch (err: any) {
      setSyncError(err.message || "Failed to delete employee");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        subsidiaries, agents, tasks, logs, transactions, leads, employees,
        createSubsidiary, createAgent, createTask, assignAgentToTask,
        allocateFunds, startTask, parseDirectorCommand, clearLogs,
        isSyncing, syncError, lastSyncedAt, resetState,
        createTransaction, createLead, updateLeadStage, deleteLead,
        createEmployee, deleteEmployee
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
