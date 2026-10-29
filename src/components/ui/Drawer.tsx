import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string; // default max-w-[560px]
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width = 'max-w-[560px]',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      drawerRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`w-full ${width} bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E7EB] focus:outline-none`}
      >
        {/* Drawer Header */}
        <div className="p-4 px-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {badge && <div className="mb-1">{badge}</div>}
            <div className="text-base font-semibold text-[#111827] truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-[#6B7280] mt-0.5 font-normal truncate">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#E5E7EB]/60 rounded-md transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Drawer Footer */}
        {footer && (
          <div className="p-3.5 px-5 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-xs shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
