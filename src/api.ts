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
  deleteTask: async (taskId: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/task/${taskId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete task');
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
  chatWithAgent: async (agentId: string, message: string, history: any[], attachments: any[] = []) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, message, history, attachments }),
    });
    if (!response.ok) throw new Error('Failed to chat with agent');
    return response.json();
  },
  extractTransactionData: async (fileData: string, fileName: string, subsidiaryId: string) => {
    const response = await fetch(`${API_BASE_URL}/simulation/extract-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileData, fileName, subsidiaryId }),
    });
    if (!response.ok) throw new Error('Failed to extract transaction data');
    return response.json();
  },
  // Dynamic Roles
  fetchRoles: async () => {
    const response = await fetch(`${API_BASE_URL}/simulation/roles`);
    if (!response.ok) throw new Error('Failed to fetch role blueprints');
    return response.json();
  },
  createRole: async (roleData: any) => {
    const response = await fetch(`${API_BASE_URL}/simulation/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    if (!response.ok) throw new Error('Failed to save role blueprint');
    return response.json();
  },
  // Catalog Management
  fetchCatalog: async () => {
    const response = await fetch(`${API_BASE_URL}/catalog`);
    if (!response.ok) throw new Error('Failed to fetch product catalog');
    return response.json();
  },
  addItem: async (itemData: any) => {
    const response = await fetch(`${API_BASE_URL}/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error('Failed to create catalog item');
    return response.json();
  },
  clearCatalog: async () => {
    const response = await fetch(`${API_BASE_URL}/catalog/clear`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to clear catalog');
    return response.json();
  },
  uploadCatalog: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/catalog/upload`, {
      method: 'POST',
      body: formData, // Fetch sets multipart boundary automatically
    });
    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(errMsg || 'Failed to upload and parse catalog file');
    }
    return response.json();
  },

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  /** Configure (or disable) an agent's autonomous heartbeat. */
  configureHeartbeat: async (
    agentId: string,
    enabled: boolean,
    intervalMinutes: number,
    instruction: string,
  ) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/heartbeat`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, intervalMinutes, instruction }),
    });
    if (!response.ok) throw new Error('Failed to configure heartbeat');
    return response.json();
  },

  /** Retrieve the most recent heartbeat execution logs for an agent. */
  fetchHeartbeatLogs: async (agentId: string, limit = 20) => {
    const response = await fetch(
      `${API_BASE_URL}/agents/${agentId}/heartbeat-logs?limit=${limit}`,
    );
    if (!response.ok) throw new Error('Failed to fetch heartbeat logs');
    return response.json();
  },

  /** Clear all heartbeat logs for an agent. */
  clearHeartbeatLogs: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/heartbeat-logs`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear heartbeat logs');
    return response.json();
  },

  /** Immediately fire a heartbeat pulse (for manual trigger / testing). */
  triggerHeartbeat: async (agentId: string) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/heartbeat/trigger`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to trigger heartbeat');
    return response.json();
  },

  // ── Agent Edit ──────────────────────────────────────────────────────────────

  /** PATCH any subset of mutable agent fields. Returns the updated agent. */
  updateAgent: async (agentId: string, data: Record<string, any>) => {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update agent');
    return response.json();
  },

  /** Backfill heartbeat instructions for all agents that have none set. */
  seedHeartbeatInstructions: async () => {
    const response = await fetch(`${API_BASE_URL}/agents/seed-heartbeat-instructions`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to seed heartbeat instructions');
    return response.json();
  },

  /** Fetch unified execution logs (Chats, Tasks, Heartbeats) */
  fetchExecutionLogs: async (limit: number = 1000, hours?: number) => {
    let url = `${API_BASE_URL}/execution-logs?limit=${limit}`;
    if (hours) url += `&hours=${hours}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch execution logs');
    return response.json();
  },
};

