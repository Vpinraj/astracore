import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { CreateTaskModal } from './CreateModals';
import { ClipboardList, Plus, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const TaskBoard: React.FC = () => {
  const { tasks, agents, subsidiaries, assignAgentToTask, startTask } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group tasks
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const getSubsidiary = (subId: string) => {
    return subsidiaries.find((s) => s.id === subId);
  };

  const getAgent = (agentId: string) => {
    return agents.find((a) => a.id === agentId);
  };

  const handleAssignAgent = async (taskId: string, agentId: string) => {
    if (!agentId) return;
    try {
      await assignAgentToTask(taskId, agentId);
    } catch (err) {
      console.error("Failed to assign agent to task:", err);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
    } catch (err) {
      console.error("Failed to start task:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Board Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-base md:text-lg font-bold text-zinc-100 tracking-wide flex items-center gap-2">
            <ClipboardList className="text-purple-400" size={20} />
            Task Operations Board
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Manage enterprise operations, dispatch tasks, and allocate AI agents</p>
        </div>
        <Button
          variant="purple"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 font-semibold"
        >
          <Plus size={16} /> Create Task
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* 1. PENDING & UNASSIGNED COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Pending / Unassigned ({pendingTasks.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-600 bg-zinc-950/15 border border-dashed border-zinc-900 rounded-xl">
                No pending tasks found. Create one to begin.
              </div>
            ) : (
              pendingTasks.map((task) => {
                const sub = getSubsidiary(task.subsidiaryId);
                const assignedAgent = getAgent(task.assignedAgentId);
                const idleSubsidiaryAgents = agents.filter(
                  (a) => a.subsidiaryId === task.subsidiaryId && a.status === 'idle'
                );

                return (
                  <Card key={task.id} className="p-4 bg-zinc-950/40 border-zinc-900 hover:border-zinc-800/80 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none tracking-tight font-semibold bg-zinc-900 border border-zinc-800 ${sub?.textColor || 'text-zinc-400'} shrink-0`}>
                        {sub?.name || 'Unknown'}
                      </span>
                      <Badge variant="pending">pending</Badge>
                    </div>

                    <h5 className="text-xs font-bold text-zinc-200 mt-1">{task.title}</h5>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">{task.description}</p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-900/60 text-[9px] font-mono text-zinc-400">
                      <div>
                        <span className="text-zinc-600 block">Cost Fee</span>
                        <span className="text-rose-400 font-semibold">₹{task.cost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 block">Projected Yield</span>
                        <span className="text-emerald-400 font-semibold">₹{task.payout.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Agent allocation interface */}
                    <div className="mt-4 pt-3 border-t border-zinc-900/60 space-y-2">
                      {assignedAgent ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] text-zinc-600 block">Assigned Agent</span>
                            <span className="text-[10px] text-zinc-300 font-mono font-medium block truncate">
                              {assignedAgent.avatar} {assignedAgent.name} ({assignedAgent.role})
                            </span>
                          </div>
                          <Button
                            variant="purple"
                            size="xs"
                            onClick={() => handleStartTask(task.id)}
                            className="flex items-center gap-1 text-[9px] py-1 font-mono font-bold uppercase shrink-0"
                          >
                            <Play size={10} /> Dispatch
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-mono block">Allocate AI Agent</span>
                          {idleSubsidiaryAgents.length === 0 ? (
                            <div className="flex items-center gap-1 text-[9px] text-rose-400 bg-rose-950/10 border border-rose-900/30 p-2 rounded-lg">
                              <AlertCircle size={10} />
                              <span>No idle agents in {sub?.name || 'subsidiary'}. Hire one first.</span>
                            </div>
                          ) : (
                            <select
                              onChange={(e) => handleAssignAgent(task.id, e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Select agent to allocate...</option>
                              {idleSubsidiaryAgents.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.role}) — Eff: {a.efficiency}x
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* 2. IN PROGRESS COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              In Progress ({inProgressTasks.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {inProgressTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-600 bg-zinc-950/15 border border-dashed border-zinc-900 rounded-xl">
                No active execution pipelines running.
              </div>
            ) : (
              inProgressTasks.map((task) => {
                const sub = getSubsidiary(task.subsidiaryId);
                const assignedAgent = getAgent(task.assignedAgentId);

                return (
                  <Card key={task.id} className="p-4 bg-zinc-950/60 border-indigo-950/30 border-2 shadow-[0_0_15px_rgba(99,102,241,0.02)]">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none tracking-tight font-semibold bg-zinc-900 border border-zinc-800 ${sub?.textColor || 'text-zinc-400'} shrink-0`}>
                        {sub?.name || 'Unknown'}
                      </span>
                      <Badge variant="in_progress">{task.progress}%</Badge>
                    </div>

                    <h5 className="text-xs font-bold text-zinc-200 mt-1">{task.title}</h5>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">{task.description}</p>

                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-900/60 text-[9px] font-mono">
                      <span className="text-zinc-400">Agent: <strong className="text-zinc-200 font-medium">{assignedAgent?.name || 'AI'}</strong></span>
                      <span className="text-emerald-400 font-semibold">+₹{task.payout.toLocaleString()}</span>
                    </div>

                    <div className="mt-3">
                      <ProgressBar value={task.progress} color="indigo" />
                    </div>

                    {/* Console log snippet */}
                    {task.logs.length > 0 && (
                      <div className="mt-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900/60 font-mono text-[9px] text-purple-400 max-h-16 overflow-y-auto leading-normal select-text">
                        &gt; {task.logs[task.logs.length - 1]}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* 3. COMPLETED COLUMN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Completed ({completedTasks.length})
            </h4>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-600 bg-zinc-950/15 border border-dashed border-zinc-900 rounded-xl">
                No completed logs in the current session.
              </div>
            ) : (
              completedTasks.map((task) => {
                const sub = getSubsidiary(task.subsidiaryId);
                const assignedAgent = getAgent(task.assignedAgentId);

                return (
                  <Card key={task.id} className="p-4 bg-zinc-950/20 border-zinc-900/80 hover:border-zinc-800 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono leading-none tracking-tight font-semibold bg-zinc-900 border border-zinc-800 ${sub?.textColor || 'text-zinc-400'} shrink-0`}>
                        {sub?.name || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                        <CheckCircle2 size={11} />
                        <span>successful</span>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold text-zinc-300 mt-1">{task.title}</h5>
                    <p className="text-[10px] text-zinc-500 mt-1">{task.description}</p>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-900/60 text-[9px] font-mono">
                      <span className="text-zinc-500">Processed by: <strong className="text-zinc-400">{assignedAgent?.name || 'AI Agent'}</strong></span>
                      <span className="text-emerald-400 font-bold">+₹{task.payout.toLocaleString()}</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
