import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CreateAgentModal } from './CreateModals';
import { Users, UserPlus, MessageSquare, Search, Building2 } from 'lucide-react';

import { openAgentChat } from '../store/slices/agentSlice';

export const AgentBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const agents = useAppSelector(state => state.agents.items);
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  
  const [filterSub, setFilterSub] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const filteredAgents = agents.filter((agent) => {
    const matchSub = filterSub === 'all' || agent.subsidiaryId === filterSub;
    const matchStatus = filterStatus === 'all' ||
                        (filterStatus === 'idle' && agent.status === 'idle') ||
                        (filterStatus === 'working' && agent.status === 'working');
    const matchSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSub && matchStatus && matchSearch;
  });

  const getSubsidiaryName = (subId: string) => {
    return subsidiaries.find((s) => s.id === subId)?.name || 'Unknown Subsidiary';
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Filters & Actions Header */}
      <div className="flex flex-col gap-4 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-start gap-3 flex-1">
            <div className="space-y-1 flex-1 min-w-[140px] max-w-xs">
              <span className="text-[10px] text-zinc-500 font-mono block">SEARCH AGENTS</span>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Search by name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="space-y-1 flex-1 min-w-[140px] max-w-[200px]">
              <span className="text-[10px] text-zinc-500 font-mono block">FILTER SUBSIDIARY</span>
              <select
                value={filterSub}
                onChange={(e) => setFilterSub(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="all">All Subsidiaries</option>
                {subsidiaries.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 flex-1 min-w-[120px] max-w-[160px]">
              <span className="text-[10px] text-zinc-500 font-mono block">FILTER STATUS</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="idle">Idle Agents</option>
                <option value="working">Working Agents</option>
              </select>
            </div>
          </div>

          <div className="flex shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAgentModalOpen(true)}
              className="flex items-center gap-1.5 border-zinc-700/60 font-medium"
            >
              <UserPlus size={15} /> Hire AI Agent
            </Button>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/30">
        <table className="w-full min-w-[800px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-950/60 border-b border-zinc-900 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
              <th className="p-4 pl-5">Agent</th>
              <th className="p-4">Role</th>
              <th className="p-4">Subsidiary Node</th>
              <th className="p-4">Level & Efficiency</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 md:p-12 text-center text-zinc-500 bg-zinc-950/15">
                  <Users className="mx-auto text-zinc-700 w-10 h-10 mb-3" />
                  <p className="text-sm font-semibold">No agents found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try modifying your filter options or deploy a new agent blueprint.</p>
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent) => (
                <tr 
                  key={agent.id} 
                  className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                  onClick={() => dispatch(openAgentChat({ agentId: agent.id }))}
                >
                  <td className="p-4 pl-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-xl w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {agent.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-100 truncate">{agent.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{agent.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="role" className="px-1.5 py-0.5">{agent.role}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-zinc-600" />
                      <span className="font-medium text-zinc-300 truncate">
                        {getSubsidiaryName(agent.subsidiaryId)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400">LVL {agent.level}</div>
                      <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500" 
                          style={{ width: `${Math.min(100, agent.efficiency * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={agent.status as any}>{agent.status}</Badge>
                  </td>
                  <td className="p-4 pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => dispatch(openAgentChat({ agentId: agent.id }))}
                      className="p-1.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10"
                      title="Message Agent"
                    >
                      <MessageSquare size={14} className="mr-1.5 inline" /> Chat
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />
    </div>
  );
};
