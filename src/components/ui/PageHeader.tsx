import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  actions,
  badge,
}) => {
  const desc = description || subtitle;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] leading-[34px] font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {desc && (
          <p className="text-sm leading-5 font-normal text-slate-500 mt-1 truncate max-w-3xl">
            {desc}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
