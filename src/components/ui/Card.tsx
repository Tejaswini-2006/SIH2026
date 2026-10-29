import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  description,
  subtitle,
  action,
  actions,
  footer,
  noPadding = false,
}) => {
  const desc = description || subtitle;
  const act = action || actions;
  const hasHeader = Boolean(title || desc || act);

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg overflow-hidden transition-colors ${className}`}
    >
      {hasHeader && (
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h2 className="text-[15px] leading-5 font-semibold text-[#111827] truncate">{title}</h2>
            ) : (
              title
            )}
            {desc && (
              <p className="text-xs text-[#6B7280] mt-0.5 font-normal">{desc}</p>
            )}
          </div>
          {act && <div className="shrink-0">{act}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-5'}>{children}</div>

      {footer && (
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#6B7280]">
          {footer}
        </div>
      )}
    </div>
  );
};
