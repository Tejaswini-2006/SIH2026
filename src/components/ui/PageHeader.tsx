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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] leading-7 font-semibold text-[#111827] tracking-normal truncate">
            {title}
          </h1>
          {badge}
        </div>
        {desc && (
          <p className="text-[13px] leading-5 text-[#4B5563] mt-1 font-normal">
            {desc}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">{actions}</div>}
    </div>
  );
};
