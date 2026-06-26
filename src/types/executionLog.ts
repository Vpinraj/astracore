export interface ExecutionLogDto {
  id: string;
  agentId: string;
  agentName: string;
  type: 'Chat' | 'Task' | 'Heartbeat';
  timestamp: string;
  input: string;
  output: string;
  status: string;
}
