import React from 'react';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';

export type TableDensity = 'comfortable' | 'compact';

export interface ColumnDef<T> {
  key?: string;
  id?: string;
  header: React.ReactNode;
  width?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  accessor?: keyof T;
  render: (row: T, index: number) => React.ReactNode;
}

export type Column<T> = ColumnDef<T>;

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedId?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  density?: TableDensity;
  emptyState?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  defaultSort?: { columnId: string; direction: string };
  defaultPageSize?: number;
  stickyHeader?: boolean;
  
  // Pagination
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedId,
  sortField,
  sortDirection,
  onSort,
  density = 'comfortable',
  emptyState,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50],
  className = '',
}: DataTableProps<T>) {
  const rowHeightClass = density === 'compact' ? 'h-[38px] py-1.5' : 'h-[48px] py-2.5';
  const hasPagination = Boolean(currentPage && pageSize && totalItems !== undefined && onPageChange);

  const totalPages = hasPagination ? Math.max(1, Math.ceil((totalItems || 0) / (pageSize || 15))) : 1;
  const startItem = hasPagination ? ((currentPage || 1) - 1) * (pageSize || 15) + 1 : 1;
  const endItem = hasPagination ? Math.min(totalItems || 0, (currentPage || 1) * (pageSize || 15)) : data.length;

  return (
    <div className={`bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Scrollable Container with sticky header */}
      <div className="overflow-x-auto w-full relative">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-semibold sticky top-0 z-10 select-none">
            <tr>
              {columns.map((col, idx) => {
                const colKey = col.key || col.id || String(idx);
                const isFirst = idx === 0;
                const isLast = idx === columns.length - 1;
                const isSorted = sortField === colKey;

                return (
                  <th
                    key={colKey}
                    style={{ width: col.width }}
                    className={`px-4 py-3 whitespace-nowrap text-xs font-semibold ${col.className || ''} ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.sortable ? 'cursor-pointer hover:text-[#111827]' : ''} ${
                      isFirst ? 'sticky left-0 bg-[#F9FAFB] z-20' : ''
                    } ${isLast ? 'sticky right-0 bg-[#F9FAFB] z-20' : ''}`}
                    onClick={() => col.sortable && onSort?.(colKey)}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end w-full' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#9CA3AF]">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#2457D6]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#2457D6]" />
                            )
                          ) : null}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-[#6B7280]">
                  {emptyState || 'No records found'}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = keyExtractor(row);
                const isSelected = selectedId === key;

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-blue-50/60'
                        : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {columns.map((col, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === columns.length - 1;

                      return (
                        <td
                          key={col.key || col.id || String(idx)}
                          className={`px-4 ${rowHeightClass} ${col.className || ''} ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          } ${
                            isFirst ? 'sticky left-0 bg-white group-hover:bg-[#F9FAFB] z-10' : ''
                          } ${
                            isLast ? 'sticky right-0 bg-white group-hover:bg-[#F9FAFB] z-10' : ''
                          }`}
                        >
                          {col.render(row, index)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {hasPagination && (
        <div className="px-4 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              Showing <strong className="text-[#111827] font-semibold">{totalItems === 0 ? 0 : startItem}–{endItem}</strong> of{' '}
              <strong className="text-[#111827] font-semibold">{totalItems}</strong>
            </span>

            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 ml-2 border-l border-[#E5E7EB] pl-3">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-white border border-[#E5E7EB] rounded px-1.5 py-0.5 text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#2457D6]"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(1, (currentPage || 1) - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange?.(Math.min(totalPages, (currentPage || 1) + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
