export const API_BASE_URL = 'http://localhost:5035/api';

export const api = {
  fetchState: async () => {
    const response = await fetch(`${API_BASE_URL}/simulation/state`);
    if (!response.ok) throw new Error('Failed to fetch state');
    return response.json();
  },
  tick: async () => {
    const response = await fetch(`${API_BASE_URL}/simulation/tick`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to tick simulation');
    return response.json();
  },
  resetState: async () => {
    const response = await fetch(`${API_BASE_URL}/simulation/reset`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to reset state');
    return response.json();
  },
  createSubsidiary: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/subsidiary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create subsidiary');
    return response.json();
  },
  createAgent: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create agent');
    return response.json();
  },
  createTask: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },
  assignAgentToTask: async (taskId: string, agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/task/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, agentId }),
    });
    if (!response.ok) throw new Error('Failed to assign task');
    return response.json();
  },
  startTask: async (taskId: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/start-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    if (!response.ok) throw new Error('Failed to start task');
    return response.json();
  },
  answerTaskQuestion: async (taskId: string, answer: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/task/${taskId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    if (!response.ok) throw new Error('Failed to answer task');
    return response.json();
  },
  allocateFunds: async (subsidiaryId: string, amount: number) => {
    const response = await fetch(`${API_BASE_URL}/simulation/allocate-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subsidiaryId, amount }),
    });
    if (!response.ok) throw new Error('Failed to allocate funds');
    return response.json();
  },
  clearLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/simulation/clear-logs`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to clear logs');
    return response.json();
  },
  parseDirectorCommand: async (command: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (!response.ok) throw new Error('Failed to parse command');
    return response.json();
  },
  createTransaction: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
  },
  createLead: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create lead');
    return response.json();
  },
  updateLeadStage: async (leadId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update lead');
    return response.json();
  },
  deleteLead: async (leadId: string) => {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete lead');
    return response.json();
  },
  createEmployee: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create employee');
    return response.json();
  },
  deleteEmployee: async (employeeId: string) => {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  },
  chatWithAgent: async (agentId: string, message: string, history: any[]) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, message, history }),
    });
    if (!response.ok) throw new Error('Failed to chat with agent');
    return response.json();
  },
};
