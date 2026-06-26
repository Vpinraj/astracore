import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api';
import { ExecutionLogDto } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Terminal, Clock, Activity, MessageSquare } from 'lucide-react';

export const ExecutionLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ExecutionLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState<'All' | 'Chat' | 'Task' | 'Heartbeat'>('All');
  const [timeFilter, setTimeFilter] = useState<'5m' | '30m' | '1h' | '24h' | 'all'>('1h');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Detailed view
  const [selectedLog, setSelectedLog] = useState<ExecutionLogDto | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        let hours: number | undefined;
        if (timeFilter === '5m') hours = 5 / 60;
        else if (timeFilter === '30m') hours = 0.5;
        else if (timeFilter === '1h') hours = 1;
        else if (timeFilter === '24h') hours = 24;

        const data = await api.fetchExecutionLogs(1000, hours);
        setLogs(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [timeFilter]);

  const agents = useMemo(() => {
    const unique = new Set(logs.map(l => l.agentName));
    return Array.from(unique).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (activeTab !== 'All' && log.type !== activeTab) return false;
      if (selectedAgent !== 'all' && log.agentName !== selectedAgent) return false;
      return true;
    });
  }, [logs, activeTab, selectedAgent]);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Chat': return <MessageSquare size={14} className="text-blue-400" />;
      case 'Task': return <Terminal size={14} className="text-purple-400" />;
      case 'Heartbeat': return <Activity size={14} className="text-green-400" />;
      default: return <Activity size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('completed')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (s.includes('fail') || s.includes('error')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (s.includes('pending') || s.includes('progress')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-zinc-400 bg-zinc-800 border-zinc-700';
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Terminal className="text-indigo-500" />
          Agent Execution Logs
        </h1>
        <p className="text-sm text-zinc-400">
          Unified timeline of all AI agent activities including chats, task executions, and autonomous heartbeats.
        </p>
      </div>

      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl overflow-hidden flex flex-col flex-1">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-900/60 bg-zinc-900/20 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2">
            {['All', 'Chat', 'Task', 'Heartbeat'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3 items-center">
            <select 
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Agents</option>
              {agents.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select 
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="5m">Last 5 Mins</option>
              <option value="30m">Last 30 Mins</option>
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-zinc-500">Loading logs...</div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-400">{error}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-zinc-500">No logs found for the selected filters.</div>
          ) : (
            <table className="w-full text-left text-sm text-zinc-400 border-collapse">
              <thead className="bg-zinc-900/50 text-xs uppercase font-semibold text-zinc-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 border-b border-zinc-800">Timestamp</th>
                  <th className="px-4 py-3 border-b border-zinc-800">Type</th>
                  <th className="px-4 py-3 border-b border-zinc-800">Agent</th>
                  <th className="px-4 py-3 border-b border-zinc-800 w-2/5">Input Preview</th>
                  <th className="px-4 py-3 border-b border-zinc-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] flex items-center gap-2">
                      <Clock size={12} className="text-zinc-600" />
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(log.type)}
                        <span className="font-medium text-zinc-300">{log.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-300">
                      {log.agentName}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[200px] md:max-w-[400px]">
                      {log.input ? log.input.substring(0, 80) : ''}{log.input?.length > 80 ? '...' : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(log.status)}`}>
                        {log.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`${selectedLog.type} Details: ${selectedLog.agentName}`}
          size="xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 text-sm">
            <div className="flex gap-4 mb-4 text-xs font-mono text-zinc-500 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
              <div><strong>Time:</strong> {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : 'N/A'}</div>
              <div><strong>Status:</strong> <span className={getStatusColor(selectedLog.status).split(' ')[0]}>{selectedLog.status}</span></div>
              <div><strong>ID:</strong> {selectedLog.id}</div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-400 uppercase text-xs tracking-wider border-b border-zinc-800 pb-1">Input / Prompt</h4>
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                {selectedLog.input || <span className="text-zinc-600 italic">No input data</span>}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="font-semibold text-teal-400 uppercase text-xs tracking-wider border-b border-zinc-800 pb-1">Output / Response</h4>
              <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                {selectedLog.output || <span className="text-zinc-600 italic">No output data</span>}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} variant="outline">Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
