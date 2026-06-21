import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { ArrowLeft, Users, Terminal, Plus, DollarSign } from 'lucide-react';
import { CreateAgentModal, CreateTaskModal } from './CreateModals';
import { CreateTransactionModal } from './CreateTransactionModal';
import { BalanceSheet } from './BalanceSheet';
import type { Subsidiary } from '../types';

interface SubsidiaryDetailProps {
  subsidiary: Subsidiary;
  onClose: () => void;
}

export const SubsidiaryDetail: React.FC<SubsidiaryDetailProps> = ({ subsidiary, onClose }) => {
  const { agents, tasks, leads, allocateFunds } = useApp();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'agents' | 'tasks'>('agents');

  const subAgents = agents.filter((a) => a.subsidiaryId === subsidiary.id);
  const subTasks = tasks.filter((t) => t.subsidiaryId === subsidiary.id);

  const activeTasks = subTasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = subTasks.filter((t) => t.status === 'pending');
  const completedTasks = subTasks.filter((t) => t.status === 'completed');

  const handleFundingClick = () => {
    const amount = prompt(`Enter funding amount to transfer to ${subsidiary.name}:`, '20000');
    if (amount) {
      const parsed = parseInt(amount);
      if (!isNaN(parsed) && parsed > 0) {
        allocateFunds(subsidiary.id, parsed);
      }
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Detail Header bar */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="p-2 border border-zinc-800 shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <div className="min-w-0">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Subsidiary detail node</span>
          <h2 className="text-lg md:text-xl font-bold text-zinc-100 mt-0.5 truncate">{subsidiary.name} Workspace</h2>
        </div>
      </div>

      {/* Finances Overview — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-zinc-950/40 border-zinc-800/60">
          <span className="text-[10px] md:text-xs text-zinc-400">Total Seed Capital</span>
          <div className="text-base md:text-lg font-bold font-mono text-zinc-100 mt-1 md:mt-1.5">₹{subsidiary.investment.toLocaleString()}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-zinc-950/40 border-zinc-800/60">
          <span className="text-[10px] md:text-xs text-zinc-400">Operating Balance</span>
          <div className="text-base md:text-lg font-bold font-mono text-indigo-400 mt-1 md:mt-1.5">₹{subsidiary.balance.toLocaleString()}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-zinc-950/40 border-zinc-800/60">
          <span className="text-[10px] md:text-xs text-zinc-400">Ledger Expenses</span>
          <div className="text-base md:text-lg font-bold font-mono text-rose-400 mt-1 md:mt-1.5">₹{subsidiary.expenses.toLocaleString()}</div>
        </Card>
        <Card className="p-3 md:p-4 bg-zinc-950/40 border-zinc-800/60">
          <span className="text-[10px] md:text-xs text-zinc-400">Operating Profits</span>
          <div className="text-base md:text-lg font-bold font-mono text-emerald-400 mt-1 md:mt-1.5">₹{subsidiary.profits.toLocaleString()}</div>
        </Card>
      </div>

      {/* Profile & Operational Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 animate-in fade-in duration-300">
        {/* Profile Card */}
        <Card className="lg:col-span-2 p-4 bg-zinc-950/40 border-zinc-800/60 space-y-4">
          <div className="flex items-start gap-4">
            {subsidiary.logoUrl ? (
              <img src={subsidiary.logoUrl} alt="Logo" className="w-14 h-14 rounded-xl border border-zinc-800 object-cover bg-zinc-900" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-xl font-bold">
                🏢
              </div>
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">{subsidiary.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{subsidiary.description || "No description provided for this subsidiary node."}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono border-t border-zinc-900/60 pt-4">
            <div className="space-y-2">
              <div><span className="text-zinc-500">Website:</span> {subsidiary.website ? <a href={subsidiary.website} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">{subsidiary.website}</a> : <span className="text-zinc-500">N/A</span>}</div>
              <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-300">{subsidiary.email || 'N/A'}</span></div>
              <div><span className="text-zinc-500">Phone:</span> <span className="text-zinc-300">{subsidiary.phone || 'N/A'}</span></div>
            </div>
            <div className="space-y-2">
              <div><span className="text-zinc-500">Address:</span> <span className="text-zinc-300">{subsidiary.address || 'N/A'}</span></div>
              <div><span className="text-zinc-500">Bank details:</span> <span className="text-zinc-300">{subsidiary.bankDetails || 'N/A'}</span></div>
            </div>
          </div>
        </Card>

        {/* Operational Metrics Card */}
        <Card className="lg:col-span-1 p-4 bg-zinc-950/40 border-zinc-800/60 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest border-b border-zinc-900/60 pb-2">Operational Metrics</h4>
            <div className="grid grid-cols-3 gap-2 py-5 text-center font-mono">
              <div className="p-2 bg-zinc-900/40 border border-zinc-900/80 rounded-lg">
                <span className="text-[9px] text-zinc-500 block leading-none">Procurements</span>
                <span className="text-sm font-bold text-indigo-400 mt-2 block">{subsidiary.procurements || 0}</span>
              </div>
              <div className="p-2 bg-zinc-900/40 border border-zinc-900/80 rounded-lg">
                <span className="text-[9px] text-zinc-500 block leading-none">Sales</span>
                <span className="text-sm font-bold text-emerald-400 mt-2 block">{subsidiary.sales || 0}</span>
              </div>
              <div className="p-2 bg-zinc-900/40 border border-zinc-900/80 rounded-lg">
                <span className="text-[9px] text-zinc-500 block leading-none">Leads</span>
                <span className="text-sm font-bold text-amber-400 mt-2 block">{leads.filter(l => l.subsidiaryId === subsidiary.id).length}</span>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-mono text-zinc-500 text-center">Metrics refreshed every simulation tick.</div>
        </Card>
      </div>

      {/* Mobile Tab Switcher — only visible on small screens */}
      <div className="flex lg:hidden rounded-xl border border-zinc-800 overflow-hidden">
        <button
          onClick={() => setActiveSection('agents')}
          className={`flex-1 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider transition-colors ${
            activeSection === 'agents'
              ? 'bg-purple-950/40 text-purple-400 border-r border-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950/30 border-r border-zinc-800'
          }`}
        >
          <Users size={12} className="inline mr-1.5" />
          Agents ({subAgents.length})
        </button>
        <button
          onClick={() => setActiveSection('tasks')}
          className={`flex-1 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider transition-colors ${
            activeSection === 'tasks'
              ? 'bg-purple-950/40 text-purple-400'
              : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950/30'
          }`}
        >
          <Terminal size={12} className="inline mr-1.5" />
          Tasks ({subTasks.length})
        </button>
      </div>

      {/* Main split: Agents & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">

        {/* Left Column: Subsidiary Agent Roster */}
        <div className={`lg:col-span-1 space-y-4 ${activeSection !== 'agents' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              Agent Squad ({subAgents.length})
            </h3>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsAgentModalOpen(true)}
              className="border-zinc-700/60 text-xs px-2.5 py-1 flex items-center gap-1.5"
            >
              <Plus size={12} /> Hire Agent
            </Button>
          </div>

          <div className="space-y-3">
            {subAgents.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 italic rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20">
                No active agent subroutines in this subsidiary.
              </div>
            ) : (
              subAgents.map((agent) => (
                <Card key={agent.id} className="p-3 bg-zinc-950/50 border-zinc-900 flex items-center justify-between hover:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      {agent.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <span className="truncate">{agent.name}</span>
                        <Badge variant="role" className="px-1 text-[8px] shrink-0">LVL {agent.level}</Badge>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wide block mt-0.5">{agent.role}</span>
                    </div>
                  </div>
                  <Badge variant={agent.status} className="shrink-0 ml-2">{agent.status}</Badge>
                </Card>
              ))
            )}
          </div>

          {/* Ledger Operations Card */}
          <Card className="p-4 bg-purple-950/5 border-purple-500/10 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Ledger Operations</span>
              <p className="text-xs text-zinc-400 mt-1">Deduct money from parent organization or record manual invoices & bills.</p>
            </div>
            <div className="space-y-2 pt-1">
              <Button
                variant="purple"
                size="xs"
                onClick={handleFundingClick}
                className="w-full flex items-center justify-center gap-1.5 font-semibold text-xs"
              >
                <DollarSign size={13} /> Allocate Ledger Funds
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsTxModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 font-semibold text-xs border-zinc-800 hover:bg-zinc-900/60"
              >
                <Plus size={13} /> Record Transaction
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Columns: Tasks Dashboard */}
        <div className={`lg:col-span-2 space-y-4 ${activeSection !== 'tasks' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Terminal size={16} className="text-purple-400" />
              Tasks Directory ({subTasks.length})
            </h3>
            <Button
              variant="purple"
              size="xs"
              onClick={() => setIsTaskModalOpen(true)}
              className="text-xs px-2.5 py-1 flex items-center gap-1.5 font-semibold"
              disabled={subAgents.filter(a => a.status === 'idle').length === 0}
              title={subAgents.filter(a => a.status === 'idle').length === 0 ? 'No idle agents available' : ''}
            >
              <Plus size={12} /> Assign Task
            </Button>
          </div>

          {/* Subdivided list of tasks */}
          <div className="space-y-6">
            {/* 1. Active Tasks */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 font-mono uppercase tracking-widest mb-3">
                Deployments In Progress ({activeTasks.length})
              </h4>
              {activeTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600 italic bg-zinc-950/10 rounded-xl border border-zinc-900">
                  No active task streams currently processing.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeTasks.map((task) => {
                    const agent = agents.find((a) => a.id === task.assignedAgentId);
                    return (
                      <Card key={task.id} className="p-4 bg-zinc-950/60 border-zinc-900">
                        <div className="flex justify-between items-start mb-2.5 gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-100">{task.title}</h5>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">{task.description}</span>
                          </div>
                          <Badge variant="in_progress" className="shrink-0">in progress</Badge>
                        </div>

                        {/* Agent line info */}
                        <div className="flex flex-wrap items-center gap-2 my-2 text-[10px] text-zinc-400">
                          <span className="text-zinc-600">Assigned:</span>
                          <span className="font-semibold text-zinc-300">{agent?.name} ({agent?.role})</span>
                          <span className="text-zinc-600">Yield:</span>
                          <span className="text-emerald-400 font-mono">+₹{task.payout.toLocaleString()}</span>
                        </div>

                        <ProgressBar value={task.progress} color="indigo" showText />

                        {/* Recent log snippet inside task */}
                        {task.logs.length > 0 && (
                          <div className="mt-3 bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-900/60 font-mono text-[9px] text-purple-400 max-h-16 overflow-y-auto leading-normal">
                            &gt; {task.logs[task.logs.length - 1]}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 font-mono uppercase tracking-widest mb-3">
                  Pending Executions ({pendingTasks.length})
                </h4>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <Card key={task.id} className="p-3 bg-zinc-950/20 border-zinc-900 flex justify-between items-center text-xs gap-2">
                      <div className="min-w-0">
                        <h5 className="font-bold text-zinc-200 truncate">{task.title}</h5>
                        <span className="text-[10px] text-zinc-500 block mt-0.5">Yield: ₹{task.payout.toLocaleString()}</span>
                      </div>
                      <Badge variant="pending" className="shrink-0">pending</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Completed Tasks */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 font-mono uppercase tracking-widest mb-3">
                Completed Logs ({completedTasks.length})
              </h4>
              {completedTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600 italic bg-zinc-950/10 rounded-xl border border-zinc-900">
                  No completed logs found in this cluster registry.
                </div>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5">
                  {completedTasks.map((task) => {
                    const agent = agents.find((a) => a.id === task.assignedAgentId);
                    return (
                      <div key={task.id} className="p-3 rounded-lg border border-zinc-900/80 bg-zinc-950/30 flex justify-between items-center text-[10px] font-mono leading-tight hover:bg-zinc-900/10 transition-colors gap-2">
                        <div className="min-w-0">
                          <h5 className="font-bold text-zinc-300 truncate">{task.title}</h5>
                          <p className="text-[9px] text-zinc-500 mt-1">Processed by {agent?.name} ({agent?.role})</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-emerald-400 font-bold font-mono">+₹{task.payout.toLocaleString()}</span>
                          <span className="text-[8px] text-zinc-600 uppercase block font-sans font-semibold mt-1">successful</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subsidiary Specific Balance Sheet Ledger */}
      <div className="space-y-3 animate-in fade-in duration-500 delay-100 pt-4">
        <h4 className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-2">
          Workspace Ledger & Balance Sheet
        </h4>
        <BalanceSheet subsidiaryId={subsidiary.id} />
      </div>

      {/* Local Modal overrides */}
      <CreateAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        defaultSubsidiaryId={subsidiary.id}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultSubsidiaryId={subsidiary.id}
      />
      <CreateTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        defaultSubsidiaryId={subsidiary.id}
      />
    </div>
  );
};
