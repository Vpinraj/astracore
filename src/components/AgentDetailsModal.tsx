import React from 'react';
import { useAppSelector } from '../store/hooks';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Agent } from '../types';
import { Building2, Bot, Brain, Zap, Cpu, HardDrive, TerminalSquare, CheckCircle2 } from 'lucide-react';

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentDetailsModal: React.FC<AgentDetailsModalProps> = ({ agent, isOpen, onClose }) => {
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);

  if (!agent) return null;

  const subsidiaryName = subsidiaries.find(s => s.id === agent.subsidiaryId)?.name || 'Unknown Subsidiary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Blueprint & Details" size="lg">
      <div className="space-y-6 text-sm text-zinc-300 pr-1 max-h-[75vh] overflow-y-auto">
        
        {/* Header Profile */}
        <div className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
          <div className="text-4xl w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 shadow-inner">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-zinc-100 truncate">{agent.name}</h3>
              <Badge variant={agent.status as any}>{agent.status}</Badge>
            </div>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">{agent.id}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="role" className="px-2 py-0.5">{agent.role}</Badge>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Building2 size={14} className="text-zinc-500" />
                {subsidiaryName}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <Zap size={14} /> <span className="text-[10px] font-mono uppercase">Level</span>
            </div>
            <p className="text-lg font-semibold text-zinc-200">{agent.level}</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <Brain size={14} /> <span className="text-[10px] font-mono uppercase">Efficiency</span>
            </div>
            <p className="text-lg font-semibold text-zinc-200">{(agent.efficiency * 100).toFixed(0)}%</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <Bot size={14} /> <span className="text-[10px] font-mono uppercase">AI Model</span>
            </div>
            <p className="text-xs font-medium text-zinc-200 mt-1 truncate" title={agent.modelId}>{agent.modelId}</p>
          </div>
          <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <HardDrive size={14} /> <span className="text-[10px] font-mono uppercase">Memory</span>
            </div>
            <p className="text-xs font-medium text-zinc-200 mt-1 capitalize">{agent.roleDefinition.memoryType.replace('_', ' ')}</p>
          </div>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <TerminalSquare size={14} /> System Instructions
          </h4>
          <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {agent.instructions || "No custom instructions provided. Using default blueprint prompt."}
          </div>
        </div>

        {/* Runtime Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
             <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Cpu size={14} /> LLM Configuration
            </h4>
            <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Temperature</span>
                <span className="font-mono text-purple-400">{agent.roleDefinition.temperature}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Max Tokens</span>
                <span className="font-mono text-purple-400">{agent.roleDefinition.maxTokens}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Output Format</span>
                <span className="font-mono text-purple-400 capitalize">{agent.roleDefinition.outputFormat}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <CheckCircle2 size={14} /> Enabled Tools
            </h4>
            <div className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 space-y-1.5 h-[90px] overflow-y-auto">
              {agent.roleDefinition.tools.filter(t => t.enabled).length > 0 ? (
                agent.roleDefinition.tools.filter(t => t.enabled).map(tool => (
                  <div key={tool.name} className="flex justify-between items-center text-xs">
                    <span className="font-mono text-zinc-300">{tool.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 italic mt-1">No execution tools enabled</div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Core Skills</h4>
          <div className="flex flex-wrap gap-2">
            {agent.roleDefinition.commonSkills.map(skill => (
              <span key={skill} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                {skill}
              </span>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
};
