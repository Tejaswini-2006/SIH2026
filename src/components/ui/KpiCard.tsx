import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'default',
  className = '',
}) => {
  const valueColor = {
    default: 'text-[#111827]',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
    info: 'text-[#2457D6]',
  }[tone];

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg p-4 flex flex-col justify-between transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-[#4B5563] truncate">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-[#9CA3AF] shrink-0" />}
      </div>

      <div className="mt-2">
        <div className={`text-2xl font-semibold tabular-nums tracking-normal ${valueColor}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-[#6B7280] mt-1 flex items-center gap-1.5 font-normal">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};
