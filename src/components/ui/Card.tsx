import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hoverEffect?: boolean;
  glowColor?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'zinc';
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = false,
  hoverEffect = false,
  glowColor = 'zinc',
  className = '',
  ...props
}) => {
  const glowColors = {
    purple: 'border-purple-500/30 hover:border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    blue: 'border-blue-500/30 hover:border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    amber: 'border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
    rose: 'border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
    indigo: 'border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]',
    zinc: 'border-zinc-800/80 hover:border-zinc-700/60 shadow-lg',
  };

  const baseStyle = 'glass-panel rounded-xl p-5 overflow-hidden transition-all duration-300';
  const glowStyle = glow ? glowColors[glowColor] : 'border-zinc-800/80';
  const hoverStyle = hoverEffect ? 'hover:-translate-y-1 hover:shadow-xl hover:bg-zinc-900/80' : '';

  return (
    <div
      className={`${baseStyle} ${glowStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
