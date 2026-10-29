import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    border: 'border-emerald-200/70',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-600',
    border: 'border-amber-200/70',
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    dot: 'bg-rose-600',
    border: 'border-rose-200/70',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
    border: 'border-blue-200/70',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200/70',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border whitespace-nowrap ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
