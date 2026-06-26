import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearLogsRequest } from '../store/slices/coreSlice';
import { Terminal, ShieldAlert, CheckCircle, Info, RefreshCw, Trash2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportAndSharePdf } from '../utils/pdfUtils';
import { Button } from './ui/Button';

export const TaskTerminal: React.FC = () => {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(state => state.core.logs);
  
  const handleClearLogs = () => {
    dispatch(clearLogsRequest());
  };
  const [filter, setFilter] = useState<'all' | 'agent' | 'success' | 'info'>('all');
  const [timeFilter, setTimeFilter] = useState<'30m' | '1h' | 'all' | 'custom'>('30m');
  const [customMinutes, setCustomMinutes] = useState<number>(120);

  const filteredLogs = logs.filter((log) => {
    // Type filtering
    if (filter === 'agent' && log.type !== 'agent_action') return false;
    if (filter === 'success' && log.type !== 'success') return false;
    if (filter === 'info' && log.type !== 'info' && log.type !== 'system') return false;

    // Time filtering
    if (timeFilter !== 'all') {
      const parts = log.id.split('-');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp)) {
          const now = Date.now();
          let maxAgeMs = 30 * 60 * 1000;
          if (timeFilter === '1h') maxAgeMs = 60 * 60 * 1000;
          if (timeFilter === 'custom') maxAgeMs = customMinutes * 60 * 1000;
          
          if (now - timestamp > maxAgeMs) {
            return false;
          }
        }
      }
    }

    return true;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={12} className="text-emerald-400 shrink-0" />;
      case 'warning':
        return <ShieldAlert size={12} className="text-rose-400 shrink-0" />;
      case 'agent_action':
        return <RefreshCw size={12} className="text-purple-400 animate-spin shrink-0" style={{ animationDuration: '6s' }} />;
      default:
        return <Info size={12} className="text-blue-400 shrink-0" />;
    }
  };

  const getLogClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'warning':
        return 'text-rose-400';
      case 'agent_action':
        return 'text-purple-300';
      case 'info':
        return 'text-blue-300';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div id="task-terminal-logs" className="flex flex-col h-[420px] sm:h-[480px] md:h-[520px] rounded-xl border border-zinc-800 bg-zinc-950/90 font-mono text-xs overflow-hidden shadow-2xl relative hologram-scanlines">
      {/* Terminal Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-zinc-900 border-b border-zinc-800/85 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={14} className="text-purple-400 shrink-0" />
          <span className="text-[10px] md:text-[11px] font-bold text-zinc-300 tracking-wider truncate">AGENT_LOGS_STREAM.EXE</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 mr-2">
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="30m">Last 30m</option>
              <option value="1h">Last 1h</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>
            {timeFilter === 'custom' && (
              <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                <input 
                  type="number" 
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
                  className="w-12 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-zinc-300 focus:outline-none focus:border-purple-500/50"
                  min="1"
                />
                m
              </div>
            )}
          </div>

          <Button
            variant={filter === 'all' ? 'purple' : 'ghost'}
            size="xs"
            onClick={() => setFilter('all')}
            className="px-2 py-0.5 rounded text-[10px]"
          >
            ALL
          </Button>
          <Button
            variant={filter === 'agent' ? 'purple' : 'ghost'}
            size="xs"
            onClick={() => setFilter('agent')}
            className="px-2 py-0.5 rounded text-[10px] hidden sm:block"
          >
            AGENTS
          </Button>
          <Button
            variant={filter === 'success' ? 'purple' : 'ghost'}
            size="xs"
            onClick={() => setFilter('success')}
            className="px-2 py-0.5 rounded text-[10px] hidden sm:block"
          >
            SUCCESS
          </Button>
            <Button 
              variant="outline" 
              size="xs" 
              onClick={() => exportAndSharePdf('task-terminal-logs', 'Terminal_Logs_Export')}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 p-1 md:p-1.5"
              title="Export / Share Logs"
            >
              <Download size={14} />
            </Button>
            <Button 
              variant="outline" 
              size="xs" 
              onClick={handleClearLogs}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-1 md:p-1.5"
              title="Clear Logs"
            >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Mobile extra filter row — visible only on small screens when there are extra filters */}
      <div className="sm:hidden flex items-center gap-1 px-3 py-2 bg-zinc-900/70 border-b border-zinc-800/60">
        <Button
          variant={filter === 'agent' ? 'purple' : 'ghost'}
          size="xs"
          onClick={() => setFilter('agent')}
          className="px-2 py-0.5 rounded text-[10px]"
        >
          AGENTS
        </Button>
        <Button
          variant={filter === 'success' ? 'purple' : 'ghost'}
          size="xs"
          onClick={() => setFilter('success')}
          className="px-2 py-0.5 rounded text-[10px]"
        >
          SUCCESS
        </Button>
        <Button
          variant={filter === 'info' ? 'purple' : 'ghost'}
          size="xs"
          onClick={() => setFilter('info')}
          className="px-2 py-0.5 rounded text-[10px]"
        >
          INFO
        </Button>
      </div>

      {/* Terminal Screen */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-2 bg-zinc-950/70 select-text">
        <div className="text-zinc-600 border-b border-zinc-900 pb-2 text-[10px]">
          [SYSTEM NODE] Connection handshake verified. Awaiting agent subprocess logs...
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic text-center py-10">
            No pipeline actions recorded in this stream yet.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-1.5 md:gap-2.5 leading-relaxed hover:bg-zinc-900/30 py-0.5 rounded px-1 transition-colors">
              <span className="text-zinc-600 shrink-0 select-none hidden sm:inline">[{log.timestamp}]</span>

              {log.subsidiaryName && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono leading-none tracking-tight font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0 hidden sm:inline"
                >
                  {log.subsidiaryName}
                </span>
              )}

              {getLogIcon(log.type)}

              <div className={`${getLogClass(log.type)} break-all min-w-0 prose prose-invert prose-xs max-w-none`}>
                {log.agentName && <strong className="text-zinc-100 font-medium mr-1.5">{log.agentName}:</strong>}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.message}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
