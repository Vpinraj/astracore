import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: 'purple' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  showText?: boolean;
  animate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'indigo',
  showText = false,
  animate = true,
  className = '',
}) => {
  const roundedValue = Math.min(100, Math.max(0, Math.round(value)));

  const barColors = {
    purple: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    blue: 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    rose: 'bg-gradient-to-r from-rose-600 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    indigo: 'bg-gradient-to-r from-indigo-600 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
  };

  const textColors = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="w-full bg-zinc-800/80 rounded-full h-2.5 overflow-hidden border border-zinc-700/30">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              barColors[color]
            } ${animate && roundedValue > 0 && roundedValue < 100 ? 'animate-pulse' : ''}`}
            style={{ width: `${roundedValue}%` }}
          />
        </div>
        {showText && (
          <span className={`text-xs font-mono font-semibold ml-3 min-w-[32px] text-right ${textColors[color]}`}>
            {roundedValue}%
          </span>
        )}
      </div>
    </div>
  );
};
