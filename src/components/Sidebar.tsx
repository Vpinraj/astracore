import React, { useState } from 'react';
import { LayoutDashboard, Building2, Users, Terminal, Cpu, Menu, X, ClipboardList, Target, GitBranch, HelpCircle, Package, FileText } from 'lucide-react';

export type TabType = 'overview' | 'subsidiaries' | 'transactions' | 'agents' | 'tasks' | 'catalog' | 'questions' | 'terminal' | 'execution_logs' | 'leads' | 'team';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'subsidiaries' as TabType, label: 'Subsidiaries', icon: Building2 },
    { id: 'transactions' as TabType, label: 'Transactions & Ledger', icon: FileText },
    { id: 'agents' as TabType, label: 'AI Agent Squads', icon: Users },
    { id: 'tasks' as TabType, label: 'Task Board', icon: ClipboardList },
    { id: 'catalog' as TabType, label: 'Product Catalog', icon: Package },
    { id: 'questions' as TabType, label: 'Agent Doubts', icon: HelpCircle },
    { id: 'leads' as TabType, label: 'Leads CRM', icon: Target },
    { id: 'team' as TabType, label: 'Team & Org', icon: GitBranch },
    { id: 'terminal' as TabType, label: 'System Logs', icon: Terminal },
    { id: 'execution_logs' as TabType, label: 'Execution Logs', icon: FileText },
  ];

  const handleTabSelect = (tab: TabType) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const NavContent = () => (
    <>
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse-glow">
          <Cpu className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-wide font-sans leading-none m-0">AstraCore</h1>
          <span className="text-[10px] text-purple-400 font-mono font-semibold tracking-widest uppercase">Agent Network</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-950/40 to-indigo-950/30 text-purple-400 border border-purple-500/25 shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? 'text-purple-400' : 'text-zinc-400'}`} />
              <span className="text-left leading-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-6 border-t border-zinc-900">
        <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-500 font-mono">DIRECTOR NODE</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-300 font-mono">Secured Online</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button — visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-purple-500/40 transition-all duration-200 shadow-lg"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-72 h-full border-r border-zinc-800/80 bg-zinc-950/98 backdrop-blur-md flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>

            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:flex w-64 h-full border-r border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md flex-col p-6 shrink-0">
        <NavContent />
      </div>
    </>
  );
};
