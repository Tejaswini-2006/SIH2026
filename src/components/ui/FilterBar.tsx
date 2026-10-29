import React from 'react';
import { Search, X } from 'lucide-react';

export interface ActiveFilterChip {
  id?: string;
  label: string;
  value?: string;
  onRemove: () => void;
}

export interface FilterDropdown {
  id: string;
  label?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (val: string) => void;
}

interface FilterBarProps {
  searchValue?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  dropdowns?: FilterDropdown[];
  activeFilters?: ActiveFilterChip[];
  activeChips?: Array<{ id?: string; label: string; value?: string; onRemove: () => void }>;
  onClearAll?: () => void;
  showingCount?: number;
  filteredCount?: number;
  totalCount: number;
  densityToggle?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  dropdowns,
  activeFilters,
  activeChips,
  onClearAll,
  showingCount,
  filteredCount,
  totalCount,
  densityToggle,
}) => {
  const query = searchValue ?? searchQuery ?? '';
  const count = showingCount ?? filteredCount ?? totalCount;
  const chips = activeFilters ?? activeChips ?? [];

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 space-y-2.5">
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
          {onSearchChange && (
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#2457D6] text-[#111827] placeholder:text-[#9CA3AF]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-[#4B5563]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Structured Dropdowns if provided */}
          {dropdowns?.map((d) => (
            <select
              key={d.id}
              value={d.value}
              onChange={(e) => d.onChange(e.target.value)}
              aria-label={d.label || d.id}
              className="px-2.5 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2457D6] cursor-pointer"
            >
              {d.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Child Dropdown Selects */}
          {children}
        </div>

        {/* Live count & density toggle */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-xs text-[#6B7280]">
          <span className="font-medium tabular-nums">
            Showing <strong className="text-[#111827] font-semibold">{count}</strong> of{' '}
            <strong className="text-[#111827] font-semibold">{totalCount}</strong>
          </span>
          {densityToggle}
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F3F4F6] text-xs">
          <span className="text-[#6B7280] text-[11px] font-medium mr-1">Active filters:</span>
          {chips.map((chip, idx) => (
            <span
              key={chip.id || idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] text-[11px]"
            >
              <span>{chip.label}</span>
              {chip.value && <strong className="font-semibold text-[#111827]">({chip.value})</strong>}
              <button
                type="button"
                onClick={chip.onRemove}
                className="text-[#9CA3AF] hover:text-[#111827] ml-0.5 cursor-pointer"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {onClearAll && chips.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-[#2457D6] hover:underline font-medium ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};
