import React from 'react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`py-12 px-4 text-center max-w-sm mx-auto flex flex-col items-center justify-center ${className}`}>
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mb-3">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <p className="text-xs text-[#6B7280] mt-1 text-center leading-relaxed font-normal">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
