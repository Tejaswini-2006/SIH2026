import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'muted';

interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  showDot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
    border: 'border-emerald-200/80',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-600',
    border: 'border-amber-200/80',
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    dot: 'bg-rose-600',
    border: 'border-rose-200/80',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
    border: 'border-blue-200/80',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
  muted: {
    bg: 'bg-transparent',
    text: 'text-slate-400',
    dot: 'bg-slate-300',
    border: 'border-slate-200',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  icon: Icon,
  className = '',
}) => {
  const styles = variantStyles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs leading-4 font-semibold rounded-md border whitespace-nowrap ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : showDot ? (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />
      ) : null}
      <span>{label}</span>
    </span>
  );
};
