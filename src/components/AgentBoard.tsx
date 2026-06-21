import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { CreateAgentModal, CreateTaskModal } from './CreateModals';
import { Users, UserPlus, Play, Target } from 'lucide-react';

export const AgentBoard: React.FC = () => {
  const { agents, subsidiaries, tasks } = useApp();
  const [filterSub, setFilterSub] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  const filteredAgents = agents.filter((agent) => {
    const matchSub = filterSub === 'all' || agent.subsidiaryId === filterSub;
    const matchStatus = filterStatus === 'all' ||
                        (filterStatus === 'idle' && agent.status === 'idle') ||
                        (filterStatus === 'working' && agent.status === 'working');
    return matchSub && matchStatus;
  });

  const getSubsidiaryName = (subId: string) => {
    return subsidiaries.find((s) => s.id === subId)?.name || 'Unknown Subsidiary';
  };

  const handleAssignTaskClick = (agentId: string, subId: string) => {
    setSelectedAgentId(agentId);
    setSelectedSubId(subId);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Filters & Actions Header */}
      <div className="flex flex-col gap-4 bg-zinc-950/20 p-4 border border-zinc-900 rounded-xl">
        {/* Filters row */}
        <div className="flex flex-wrap items-start gap-3">
          <div className="space-y-1 flex-1 min-w-[140px]">
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

          <div className="space-y-1 flex-1 min-w-[120px]">
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

        {/* Action button */}
        <div className="flex justify-end">
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

      {/* Agents Layout grid — 1 col mobile, 2 col md */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full p-10 md:p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/15">
            <Users className="mx-auto text-zinc-700 w-10 h-10 mb-3" />
            <p className="text-sm font-semibold">No agents found</p>
            <p className="text-xs text-zinc-600 mt-1">Try modifying your filter options or deploy a new agent blueprint.</p>
          </div>
        ) : (
          filteredAgents.map((agent) => {
            // Find active task
            const activeTask = agent.activeTaskId
              ? tasks.find((t) => t.id === agent.activeTaskId)
              : null;

            return (
              <Card
                key={agent.id}
                glow={agent.status === 'working'}
                glowColor="indigo"
                className="flex flex-col bg-zinc-950/40 border-zinc-800/60"
              >
                {/* Agent Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      {agent.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-100 truncate">{agent.name}</h4>
                        <Badge variant="role" className="shrink-0">LVL {agent.level}</Badge>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wide mt-0.5 block truncate">
                        {agent.role} &bull; <span className="text-purple-400">{getSubsidiaryName(agent.subsidiaryId)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <Badge variant={agent.status}>{agent.status}</Badge>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">Efficiency: {agent.efficiency}x</span>
                  </div>
                </div>

                {/* Body Content depending on state */}
                <div className="flex-1 mt-2">
                  {activeTask ? (
                    <div className="space-y-3.5 bg-zinc-900/10 p-3 rounded-lg border border-zinc-900/60">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider font-semibold block">ACTIVE OPERATION</span>
                          <h5 className="text-xs font-bold text-zinc-200 mt-0.5 truncate">{activeTask.title}</h5>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">+${activeTask.payout.toLocaleString()}</span>
                      </div>

                      <p className="text-[10px] text-zinc-500 leading-snug">{activeTask.description}</p>

                      <ProgressBar value={activeTask.progress} color="indigo" showText />

                      {/* Log Console for thoughts */}
                      {activeTask.logs.length > 0 && (
                        <div className="mt-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 font-mono text-[9px] text-indigo-400 h-20 overflow-y-auto space-y-1 leading-normal select-text">
                          <div className="text-zinc-600 border-b border-zinc-900 pb-1.5 mb-1.5 flex justify-between">
                            <span>COGNITIVE LOG</span>
                            <span>THREAD_ID: {activeTask.id.substring(5, 9)}</span>
                          </div>
                          {activeTask.logs.slice(-3).map((log, idx) => (
                            <div key={idx} className="break-words">
                              &gt; {log}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-6 bg-zinc-950/20 border border-zinc-900 rounded-lg border-dashed">
                      <Target className="text-zinc-700 w-8 h-8 mb-2" />
                      <p className="text-xs text-zinc-400 text-center px-4">Agent subroutine is idle. Awaiting command allocation...</p>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleAssignTaskClick(agent.id, agent.subsidiaryId)}
                        className="mt-3.5 flex items-center gap-1.5 text-[10px] py-1 border border-zinc-700/50 hover:border-purple-500/25"
                      >
                        <Play size={10} className="text-indigo-400" /> Allocate Task
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Shared Modals */}
      <CreateAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultAgentId={selectedAgentId}
        defaultSubsidiaryId={selectedSubId}
      />
    </div>
  );
};
