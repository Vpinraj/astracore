import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetStateRequest } from '../store/slices/coreSlice';
import { Wallet, Landmark, TrendingDown, Network, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  showMetrics?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showMetrics = true }) => {
  const dispatch = useAppDispatch();
  const subsidiaries = useAppSelector(state => state.subsidiaries.items);
  const agents = useAppSelector(state => state.agents.items);
  const { isSyncing, syncError, lastSyncedAt } = useAppSelector(state => state.core);

  const totalInvestments = subsidiaries.reduce((sum, s) => sum + s.investment, 0);
  const totalExpenses = subsidiaries.reduce((sum, s) => sum + s.expenses, 0);
  const totalProfits = subsidiaries.reduce((sum, s) => sum + s.profits, 0);
  const netEarnings = totalProfits - totalExpenses;
  const activeAgents = agents.filter((a) => a.status === 'working').length;

  const metrics = [
    {
      label: 'Total Investments',
      value: `₹${totalInvestments.toLocaleString()}`,
      sub: 'Allocated seed funds',
      icon: Wallet,
      color: 'blue',
      textColor: 'text-blue-400',
    },
    {
      label: 'Total Expenses',
      value: `₹${totalExpenses.toLocaleString()}`,
      sub: 'Agent costs & task deployment',
      icon: TrendingDown,
      color: 'rose',
      textColor: 'text-rose-400',
    },
    {
      label: 'Net Profits',
      value: `₹${totalProfits.toLocaleString()}`,
      sub: `Net Earnings: ₹${netEarnings.toLocaleString()}`,
      icon: Landmark,
      color: 'emerald',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Running Pipelines',
      value: `${activeAgents} / ${agents.length}`,
      sub: 'Active AI agent workflow nodes',
      icon: Network,
      color: 'purple',
      textColor: 'text-purple-400',
    },
  ];

  return (
    <header className="mb-6 md:mb-8">
      {/* Top Banner Row */}
      <div className="flex justify-between items-center mb-5 md:mb-6 pl-10 md:pl-0">
        <div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Enterprise Command</span>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight mt-0.5">Control Console</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          
          {/* Database Sync Status Badge */}
          <div className={`flex px-3 py-1.5 rounded-lg border text-xs font-mono items-center gap-2 ${
            syncError 
              ? 'border-rose-500/30 bg-rose-950/20 text-rose-400' 
              : isSyncing 
                ? 'border-indigo-500/30 bg-indigo-950/20 text-indigo-400' 
                : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'
          }`}>
            {syncError ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>DB Offline</span>
              </>
            ) : isSyncing ? (
              <>
                <span className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                <span>Syncing DB...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">DB Synced {lastSyncedAt ? `@ ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}</span>
                <span className="sm:hidden">Synced</span>
              </>
            )}
          </div>

          {/* Reset DB Button */}
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset the database to the default seed state? All custom subsidiaries, hired agents, and active tasks will be overwritten.")) {
                dispatch(resetStateRequest());
              }
            }}
            disabled={isSyncing}
            className="flex px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 disabled:opacity-50 transition-all text-xs font-mono text-zinc-400 items-center gap-1.5 cursor-pointer"
            title="Reset database to default seed state"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Reset DB</span>
          </button>

          {/* Condensed runtime badge — hidden on very small screens */}
          <div className="hidden md:flex px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs font-mono text-zinc-400 items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>VIRTUAL CEO RUNTIME v4.0.2</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Row — 2 columns on mobile, 4 on desktop */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Card
                key={idx}
                glow
                glowColor={m.color as any}
                className="p-3 md:p-4 bg-zinc-950/40"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] md:text-xs font-medium text-zinc-400 leading-tight block">{m.label}</span>
                    <div className={`text-base md:text-xl font-bold font-mono tracking-tight mt-1 md:mt-1.5 ${m.textColor} truncate`}>
                      {m.value}
                    </div>
                    <span className="text-[9px] md:text-[10px] text-zinc-500 mt-0.5 md:mt-1 block truncate">{m.sub}</span>
                  </div>
                  <div className={`p-2 md:p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 ${m.textColor} shrink-0 ml-2`}>
                    <Icon size={15} className="md:hidden" />
                    <Icon size={18} className="hidden md:block" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </header>
  );
};
