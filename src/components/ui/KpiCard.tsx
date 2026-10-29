import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'hero' | 'secondary';
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'default',
  size = 'hero',
  className = '',
  onClick,
}) => {
  const isZero = value === 0 || value === '0';
  const effectiveTone = isZero ? 'default' : tone;

  const valueColor = {
    default: 'text-slate-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    info: 'text-[#2457D6]',
  }[effectiveTone];

  const iconColor = {
    default: 'text-slate-400',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
    info: 'text-[#2457D6]',
  }[effectiveTone];

  if (size === 'secondary') {
    return (
      <div
        onClick={onClick}
        className={`bg-white border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col justify-between transition-colors ${
          onClick ? 'cursor-pointer hover:border-slate-300' : ''
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs leading-4 font-medium text-slate-500 truncate">{label}</span>
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
        <div className="mt-1.5">
          <div className="text-[20px] leading-7 font-bold tabular-nums text-slate-800">
            {value}
          </div>
          {subtext && (
            <div className="text-xs leading-4 text-slate-400 mt-0.5 truncate">
              {subtext}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E5E7EB] rounded-lg p-5 flex flex-col justify-between transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs leading-4 font-medium uppercase tracking-[0.04em] text-slate-500 truncate">
          {label}
        </span>
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />}
      </div>

      <div className="mt-2.5">
        <div className={`text-[32px] sm:text-[36px] leading-10 font-bold tabular-nums tracking-tight ${valueColor}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-xs leading-4 text-slate-500 mt-1.5 flex items-center gap-1.5 font-normal">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
