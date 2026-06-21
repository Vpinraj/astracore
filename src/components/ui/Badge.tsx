import React from 'react';

type BadgeVariant = 
  | 'idle' 
  | 'working' 
  | 'thinking' 
  | 'resting' 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'role';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
}) => {
  const styles: Record<BadgeVariant, string> = {
    idle: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50',
    working: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    thinking: 'bg-amber-950/40 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
    resting: 'bg-blue-950/40 text-blue-400 border border-blue-500/30',
    pending: 'bg-zinc-900/60 text-zinc-400 border border-zinc-700/50',
    in_progress: 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.15)]',
    completed: 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    role: 'bg-purple-950/40 text-purple-400 border border-purple-500/30',
  };

  const dots: Record<BadgeVariant, string> = {
    idle: 'bg-zinc-500',
    working: 'bg-emerald-500 animate-pulse',
    thinking: 'bg-amber-500 animate-bounce',
    resting: 'bg-blue-500',
    pending: 'bg-zinc-500',
    in_progress: 'bg-indigo-500 animate-pulse',
    completed: 'bg-emerald-400',
    role: 'bg-purple-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${styles[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />
      {children}
    </span>
  );
};
