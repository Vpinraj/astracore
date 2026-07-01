import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95dvh] sm:h-[95vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full ${sizes[size]} max-h-[92dvh] sm:max-h-[90vh] bg-zinc-950/90 border border-zinc-800 sm:rounded-xl rounded-t-2xl shadow-2xl z-10 overflow-y-auto transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 glass-panel`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 border-b border-zinc-800/80 bg-zinc-900/40 sticky top-0 z-10">
          <h3 className="text-sm md:text-base font-semibold text-zinc-100 tracking-wide">{title}</h3>
          <Button
            variant="ghost"
            size="xs"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
