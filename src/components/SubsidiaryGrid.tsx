import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { allocateFundsRequest } from '../store/slices/subsidiarySlice';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ProgressBar } from './ui/ProgressBar';
import { CreateSubsidiaryModal, CreateAgentModal, CreateTaskModal } from './CreateModals';
import * as Icons from 'lucide-react';
import { Users, Terminal, Plus } from 'lucide-react';
import type { Subsidiary } from '../types';

interface SubsidiaryGridProps {
  onViewDetails: (sub: Subsidiary) => void;
}

export const SubsidiaryGrid: React.FC<SubsidiaryGridProps> = ({ onViewDetails }) => {
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);
  const tasks = useAppSelector(state => state.tasks.items);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  const businessSubs = subsidiaries.filter(s => s.id !== 'common');
  const totalProfits = businessSubs.reduce((sum, s) => sum + s.profits, 0) || 1; // avoid divide by zero

  const getDynamicIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={20} /> : <Icons.HelpCircle size={20} />;
  };

  const handleHireAgentClick = (subId: string) => {
    setSelectedSubId(subId);
    setIsAgentModalOpen(true);
  };

  const handleDeployTaskClick = (subId: string) => {
    setSelectedSubId(subId);
    setIsTaskModalOpen(true);
  };

  const handleAddFunds = (subId: string, name: string) => {
    const amount = prompt(`Enter funding amount to transfer to ${name}:`, '25000');
    if (amount) {
      const parsed = parseInt(amount);
      if (!isNaN(parsed) && parsed > 0) {
        dispatch(allocateFundsRequest({ subsidiaryId: subId, amount: parsed }));
      } else {
        alert('Invalid amount specified.');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base md:text-lg font-bold text-zinc-100 tracking-wide">Subsidiary Portfolios</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Tap any portfolio card to drill down into agent nodes</p>
        </div>
        <Button
          variant="purple"
          size="sm"
          onClick={() => setIsSubModalOpen(true)}
          className="flex items-center gap-1.5 font-semibold"
        >
          <Plus size={16} /> Add Subsidiary
        </Button>
      </div>

      {/* Grid of subsidiaries — 1 col mobile, 2 col md, 3 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {businessSubs.map((sub) => {
          const subAgents = agents.filter((a) => a.subsidiaryId === sub.id);
          const subTasks = tasks.filter((t) => t.subsidiaryId === sub.id);
          const activeSubTasks = subTasks.filter((t) => t.status === 'in_progress');
          const completedSubTasks = subTasks.filter((t) => t.status === 'completed');

          // contribution ratio
          const contribution = Math.round((sub.profits / totalProfits) * 100);

          return (
            <Card
              key={sub.id}
              glow
              hoverEffect
              glowColor={sub.textColor.replace('text-', '').replace('-400', '') as any}
              className="flex flex-col bg-zinc-950/30 border border-zinc-800/80 cursor-pointer"
              onClick={() => onViewDetails(sub)}
            >
              {/* Header card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${sub.color} text-white shadow-lg shrink-0`}>
                    {getDynamicIcon(sub.icon)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-zinc-100 hover:text-zinc-50 leading-snug truncate">{sub.name}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{sub.industry}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-zinc-500">Balance</span>
                  <div className="text-xs font-mono font-bold text-zinc-100 mt-0.5">₹{sub.balance.toLocaleString()}</div>
                </div>
              </div>

              {/* Financial stats */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-900/60 my-2 text-[10px] font-mono">
                <div>
                  <span className="text-zinc-500">Investments</span>
                  <p className="text-zinc-300 font-semibold mt-0.5">₹{sub.investment.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Expenses</span>
                  <p className="text-rose-400 font-semibold mt-0.5">₹{sub.expenses.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Profits</span>
                  <p className="text-emerald-400 font-semibold mt-0.5">₹{sub.profits.toLocaleString()}</p>
                </div>
              </div>

              {/* Metrics counts */}
              <div className="flex justify-between items-center text-xs text-zinc-400 py-2.5">
                <div className="flex items-center gap-1">
                  <Users size={12} className="text-zinc-500" />
                  <span>{subAgents.length} Agents</span>
                </div>
                <div className="flex items-center gap-1">
                  <Terminal size={12} className="text-zinc-500" />
                  <span>{activeSubTasks.length} Run / {completedSubTasks.length} Done</span>
                </div>
              </div>

              {/* Contribution Visualizer */}
              <div className="mt-3 mb-4 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500">Profit Contribution</span>
                  <span className={`${sub.textColor} font-bold`}>{contribution}%</span>
                </div>
                <ProgressBar
                  value={contribution}
                  color={sub.textColor.replace('text-', '').replace('-400', '') as any}
                  animate={false}
                />
              </div>

              {/* Quick Actions Row */}
              <div className="mt-auto pt-3 border-t border-zinc-900/60 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleAddFunds(sub.id, sub.name)}
                  className="px-2 py-1 text-[10px]"
                >
                  Funding
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleHireAgentClick(sub.id)}
                  className="px-2 py-1 text-[10px] text-purple-400 hover:text-purple-300"
                >
                  + Agent
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => handleDeployTaskClick(sub.id)}
                  className="px-2 py-1 text-[10px] border border-zinc-700/40 font-semibold hover:border-purple-500/25"
                  disabled={subAgents.filter(a => a.status === 'idle').length === 0}
                  title={subAgents.filter(a => a.status === 'idle').length === 0 ? 'No idle agents available' : 'Assign task to idle agent'}
                >
                  Deploy Task
                </Button>
              </div>
            </Card>
          );
        })}

        {/* Placeholder create card */}
        <Card
          glow
          glowColor="zinc"
          className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 bg-zinc-950/10 min-h-[200px] md:min-h-[220px] hover:border-purple-500/40 hover:bg-zinc-950/20 group transition-all duration-300 cursor-pointer"
          onClick={() => setIsSubModalOpen(true)}
        >
          <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all duration-200">
            <Plus size={24} />
          </div>
          <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-100 mt-3.5 transition-all">Initialize Subsidiary</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-1">Deploy sandbox business clusters</span>
        </Card>
      </div>

      {/* Forms Modals */}
      <CreateSubsidiaryModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />
      <CreateAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        defaultSubsidiaryId={selectedSubId}
      />
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultSubsidiaryId={selectedSubId}
      />
    </div>
  );
};
