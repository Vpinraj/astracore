import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <>
          <Moon size={14} className="text-indigo-400" />
          <span className="text-[10px] font-mono font-medium hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <Sun size={14} className="text-amber-400 animate-spin-slow" />
          <span className="text-[10px] font-mono font-medium hidden sm:inline">Light</span>
        </>
      )}
    </button>
  );
};
