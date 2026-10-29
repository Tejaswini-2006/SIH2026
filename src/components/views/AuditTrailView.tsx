import React, { useState, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditTrailEvent } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { DataTable, Column } from '../ui/DataTable';
import { FilterBar } from '../ui/FilterBar';
import { StatusChip } from '../ui/StatusChip';

export const AuditTrailView: React.FC = () => {
  const { auditTrail } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const categories = [
    'Submission',
    'Validation',
    'Exception',
    'Correction',
    'Case Management',
    'Risk Override',
    'Report Export',
    'Settings',
  ];

  const filteredLogs = useMemo(() => {
    return auditTrail.filter((event) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        event.id.toLowerCase().includes(q) ||
        event.affectedRef.toLowerCase().includes(q) ||
        event.details.toLowerCase().includes(q) ||
        event.actorName.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'all' || event.actionCategory === selectedCategory;
      const matchesRole = selectedRole === 'all' || event.actorRole === selectedRole;

      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [auditTrail, searchQuery, selectedCategory, selectedRole]);

  const filterDropdowns = [
    {
      id: 'category',
      label: 'Action Category',
      value: selectedCategory,
      options: [
        { label: 'All Action Categories', value: 'all' },
        ...categories.map((c) => ({ label: c, value: c })),
      ],
      onChange: (val: string) => setSelectedCategory(val),
    },
    {
      id: 'role',
      label: 'Actor Role',
      value: selectedRole,
      options: [
        { label: 'All Roles', value: 'all' },
        { label: 'AICTE Analyst', value: 'AICTE Analyst' },
        { label: 'Auditor', value: 'Auditor' },
        { label: 'Institution Administrator', value: 'Institution Administrator' },
        { label: 'Automated Rule Engine', value: 'Automated Rule Engine' },
      ],
      onChange: (val: string) => setSelectedRole(val),
    },
  ];

  const activeChips = [];
  if (selectedCategory !== 'all') {
    activeChips.push({
      label: `Category: ${selectedCategory}`,
      onRemove: () => setSelectedCategory('all'),
    });
  }
  if (selectedRole !== 'all') {
    activeChips.push({
      label: `Role: ${selectedRole}`,
      onRemove: () => setSelectedRole('all'),
    });
  }

  const columns: Column<AuditTrailEvent>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      className: 'w-40',
      render: (ev) => (
        <span className="font-mono text-xs tabular-nums whitespace-nowrap text-[#4B5563]">
          {ev.timestamp}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor & Persona',
      sortable: true,
      className: 'w-52',
      render: (ev) => (
        <div className="py-0.5">
          <div className="text-xs font-medium text-[#111827] truncate max-w-[190px]" title={ev.actorName}>
            {ev.actorName}
          </div>
          <div className="text-[11px] text-[#6B7280] truncate mt-0.5" title={ev.actorRole}>
            {ev.actorRole}
          </div>
        </div>
      ),
    },
    {
      id: 'actionCategory',
      header: 'Category',
      accessor: 'actionCategory',
      sortable: true,
      className: 'w-36',
      render: (ev) => <StatusChip label={ev.actionCategory} variant="neutral" />,
    },
    {
      id: 'affectedRef',
      header: 'Affected Ref',
      accessor: 'affectedRef',
      sortable: true,
      className: 'w-40',
      render: (ev) => (
        <span className="font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
          {ev.affectedRef}
        </span>
      ),
    },
    {
      id: 'details',
      header: 'Event Detail & Context',
      className: 'min-w-[280px]',
      render: (ev) => (
        <span className="text-xs text-[#374151] line-clamp-2 leading-relaxed" title={ev.details}>
          {ev.details}
        </span>
      ),
    },
    {
      id: 'outcome',
      header: 'Outcome',
      accessor: 'outcome',
      sortable: true,
      className: 'w-28 text-right',
      render: (ev) => {
        const variant =
          ev.outcome === 'Success'
            ? 'success'
            : ev.outcome === 'Flagged'
            ? 'danger'
            : ev.outcome === 'Modified'
            ? 'warning'
            : 'neutral';
        return <StatusChip label={ev.outcome} variant={variant} />;
      },
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Audit Trail"
        subtitle="Immutable chronological event log capturing user submissions, rule evaluations, case milestones, and score overrides."
        actions={
          <span className="text-xs font-mono text-[#4B5563] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-md">
            {auditTrail.length} Entries Logged
          </span>
        }
      />

      {/* Audit Policy Notice */}
      <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-xs text-[#4B5563] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2457D6] shrink-0" />
          <span>
            <strong>Local Audit Integrity:</strong> All user mutations and rule evaluations are recorded locally in the browser runtime. In a production environment, these events stream to a certified WORM (Write Once, Read Many) compliance vault.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reference, actor, or detail text..."
        dropdowns={filterDropdowns}
        activeChips={activeChips}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedCategory('all');
          setSelectedRole('all');
        }}
        totalCount={auditTrail.length}
        filteredCount={filteredLogs.length}
      />

      {/* Main Table */}
      <Card noPadding>
        <DataTable
          data={filteredLogs}
          columns={columns}
          keyExtractor={(ev) => ev.id}
          defaultSort={{ columnId: 'timestamp', direction: 'desc' }}
          defaultPageSize={15}
          pageSizeOptions={[15, 30, 50]}
          emptyStateTitle="No audit trail events found"
          emptyStateDescription="Try adjusting search or category filters to locate specific system records."
          stickyHeader
        />
      </Card>
    </div>
  );
};
