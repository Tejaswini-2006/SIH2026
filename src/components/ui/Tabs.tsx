import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-[#E5E7EB] gap-6 text-[13px] font-medium text-[#6B7280] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`py-2.5 -mb-px border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-[#2457D6] text-[#2457D6] font-semibold'
                : 'border-transparent hover:text-[#111827] hover:border-[#D1D5DB]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                  isActive ? 'bg-blue-100 text-[#2457D6]' : 'bg-slate-100 text-[#6B7280]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
