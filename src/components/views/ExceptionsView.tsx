import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCheck,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Eye,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { ValidationException, ExceptionSeverity, ExceptionStatus } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { DataTable, Column } from '../ui/DataTable';
import { FilterBar } from '../ui/FilterBar';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

export const ExceptionsView: React.FC = () => {
  const {
    exceptions,
    resolveException,
    dismissException,
    assignException,
    escalateException,
    settings,
  } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedException, setSelectedException] = useState<ValidationException | null>(
    exceptions[0] || null
  );

  // Modal actions
  const [actionType, setActionType] = useState<
    'resolve' | 'dismiss' | 'assign' | 'escalate' | null
  >(null);
  const [actionNote, setActionNote] = useState('');
  const [assigneeName, setAssigneeName] = useState(
    settings.currentRole === 'AICTE Analyst'
      ? 'Dr. Anita Joshi (AICTE Analyst)'
      : 'V. Sundaram (Auditor)'
  );

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((ex) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ex.id.toLowerCase().includes(q) ||
        ex.institutionName.toLowerCase().includes(q) ||
        ex.ruleId.toLowerCase().includes(q) ||
        ex.reason.toLowerCase().includes(q) ||
        (ex.affectedStudentRef && ex.affectedStudentRef.toLowerCase().includes(q));

      const matchesSeverity = selectedSeverity === 'all' || ex.severity === selectedSeverity;
      const matchesStatus =
        selectedStatus === 'all'
          ? true
          : selectedStatus === 'active'
          ? ex.status !== 'Resolved' && ex.status !== 'Dismissed'
          : ex.status === selectedStatus;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [exceptions, searchQuery, selectedSeverity, selectedStatus]);

  // Keep selectedException synced
  React.useEffect(() => {
    if (filteredExceptions.length > 0) {
      if (!selectedException || !filteredExceptions.some((e) => e.id === selectedException.id)) {
        setSelectedException(filteredExceptions[0]);
      }
    }
  }, [filteredExceptions, selectedException]);

  // Handle Action Submit
  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;

    if (actionType === 'resolve') {
      if (!actionNote.trim()) return;
      resolveException(selectedException.id, actionNote.trim());
      showToast(`Resolved exception ${selectedException.id}`, 'success');
    } else if (actionType === 'dismiss') {
      if (!actionNote.trim()) return;
      dismissException(selectedException.id, actionNote.trim());
      showToast(`Dismissed exception ${selectedException.id}`, 'neutral');
    } else if (actionType === 'assign') {
      assignException(selectedException.id, assigneeName);
      showToast(`Assigned ${selectedException.id} to ${assigneeName}`, 'info');
    } else if (actionType === 'escalate') {
      if (!actionNote.trim()) return;
      escalateException(selectedException.id, actionNote.trim());
      showToast(`Escalated ${selectedException.id} to formal inquiry`, 'warning');
    }

    setActionType(null);
    setActionNote('');
    const updated = exceptions.find((ex) => ex.id === selectedException.id);
    if (updated) setSelectedException(updated);
  };

  // Metrics
  const blockingCount = exceptions.filter(
    (e) => e.severity === 'Blocking Error' && e.status !== 'Resolved' && e.status !== 'Dismissed'
  ).length;
  const warningCount = exceptions.filter(
    (e) => e.severity === 'Warning' && e.status !== 'Resolved' && e.status !== 'Dismissed'
  ).length;
  const reviewCount = exceptions.filter(
    (e) => e.severity === 'Review Required' && e.status !== 'Resolved' && e.status !== 'Dismissed'
  ).length;

  const filterDropdowns = [
    {
      id: 'severity',
      label: 'Severity',
      value: selectedSeverity,
      options: [
        { label: 'All Severities', value: 'all' },
        { label: 'Blocking Error', value: 'Blocking Error' },
        { label: 'Warning', value: 'Warning' },
        { label: 'Review Required', value: 'Review Required' },
        { label: 'Informational', value: 'Informational' },
      ],
      onChange: (val: string) => setSelectedSeverity(val),
    },
    {
      id: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Active Issues (Unresolved)', value: 'active' },
        { label: 'All Statuses', value: 'all' },
        { label: 'New', value: 'New' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Resolved', value: 'Resolved' },
        { label: 'Dismissed', value: 'Dismissed' },
        { label: 'Escalated', value: 'Escalated' },
      ],
      onChange: (val: string) => setSelectedStatus(val),
    },
  ];

  const activeChips = [];
  if (selectedSeverity !== 'all') {
    activeChips.push({
      label: `Severity: ${selectedSeverity}`,
      onRemove: () => setSelectedSeverity('all'),
    });
  }
  if (selectedStatus !== 'active') {
    activeChips.push({
      label: `Status: ${selectedStatus}`,
      onRemove: () => setSelectedStatus('active'),
    });
  }

  const columns: Column<ValidationException>[] = [
    {
      id: 'id',
      header: 'Exception ID',
      accessor: 'id',
      sortable: true,
      className: 'w-32',
      render: (ex) => (
        <span className="font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
          {ex.id}
        </span>
      ),
    },
    {
      id: 'severity',
      header: 'Severity & Rule',
      accessor: 'severity',
      sortable: true,
      className: 'w-36',
      render: (ex) => (
        <div>
          <SeverityChip status={ex.severity} />
          <div className="font-mono text-[10px] text-[#6B7280] mt-1 whitespace-nowrap">{ex.ruleId}</div>
        </div>
      ),
    },
    {
      id: 'institution',
      header: 'Institution & Violation',
      sortable: true,
      className: 'min-w-[200px]',
      render: (ex) => (
        <div className="py-0.5">
          <div className="text-xs font-medium text-[#111827] truncate max-w-xs" title={ex.institutionName}>
            {ex.institutionName}
          </div>
          <div className="text-[11px] text-[#4B5563] line-clamp-1 mt-0.5" title={ex.reason}>
            {ex.reason}
          </div>
        </div>
      ),
    },
    {
      id: 'assignedReviewer',
      header: 'Reviewer',
      accessor: 'assignedReviewer',
      className: 'w-36',
      render: (ex) => (
        <span className="text-xs text-[#6B7280] truncate block max-w-[140px]" title={ex.assignedReviewer}>
          {ex.assignedReviewer}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-28 text-right',
      render: (ex) => {
        const variant =
          ex.status === 'Resolved'
            ? 'success'
            : ex.status === 'Escalated'
            ? 'danger'
            : ex.status === 'In Review'
            ? 'info'
            : ex.status === 'Dismissed'
            ? 'neutral'
            : 'warning';
        return <StatusChip label={ex.status} variant={variant} />;
      },
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Validation & Exceptions"
        subtitle="Operational triage queue for capacity overruns, cross-institution duplicate enrolments, and data integrity violations."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <strong className="font-mono tabular-nums">{blockingCount}</strong>
              <span>Blocking</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <strong className="font-mono tabular-nums">{warningCount}</strong>
              <span>Warnings</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <strong className="font-mono tabular-nums">{reviewCount}</strong>
              <span>Review Req</span>
            </div>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search exception ID, institution, rule, or reason..."
        dropdowns={filterDropdowns}
        activeChips={activeChips}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedSeverity('all');
          setSelectedStatus('active');
        }}
        totalCount={exceptions.length}
        filteredCount={filteredExceptions.length}
      />

      {/* Split Layout: Exceptions Table (2 cols) & Detail Card (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card noPadding>
            <DataTable
              data={filteredExceptions}
              columns={columns}
              keyExtractor={(ex) => ex.id}
              onRowClick={(ex) => setSelectedException(ex)}
              defaultSort={{ columnId: 'id', direction: 'asc' }}
              defaultPageSize={10}
              pageSizeOptions={[10, 20]}
              emptyStateTitle="No validation exceptions found"
              emptyStateDescription="Try adjusting your filter criteria to view closed or resolved items."
              stickyHeader
            />
          </Card>
        </div>

        {/* Selected Exception Detail & Action Panel */}
        <div className="lg:col-span-1">
          <Card
            title={
              selectedException ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-xs text-[#111827]">
                    {selectedException.id}
                  </span>
                  <SeverityChip status={selectedException.severity} />
                </div>
              ) : (
                'Exception Detail'
              )
            }
            subtitle={
              selectedException
                ? `${selectedException.programmeName} · AY ${selectedException.academicYear}`
                : undefined
            }
          >
            {!selectedException ? (
              <div className="py-24 text-center text-[#9CA3AF] text-xs">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#9CA3AF]" />
                <p>Select an exception from the queue to inspect details and apply actions.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-sm text-[#111827]">
                    {selectedException.institutionName}
                  </h4>
                  {selectedException.affectedStudentRef && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[#6B7280]">Affected Student:</span>
                      <span className="font-mono text-xs font-medium text-[#111827] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                        {selectedException.affectedStudentRef}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reason & Evidence */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Detection Reason
                    </span>
                    <p className="text-[#111827] font-medium mt-0.5 leading-relaxed">
                      {selectedException.reason}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Supporting Evidence
                    </span>
                    <p className="text-[#374151] mt-0.5 bg-[#F9FAFB] p-2.5 rounded-md border border-[#E5E7EB] leading-relaxed font-mono text-[11px]">
                      {selectedException.evidence}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                      Suggested Regulatory Action
                    </span>
                    <p className="text-[#1E3A8A] mt-0.5 bg-blue-50/60 p-2.5 rounded-md border border-blue-100 leading-relaxed">
                      {selectedException.suggestedAction}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-[11px]">
                  <div>
                    <span className="text-[#6B7280]">Status:</span>{' '}
                    <strong className="text-[#111827]">{selectedException.status}</strong>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Reviewer:</span>{' '}
                    <strong className="text-[#111827] truncate block">
                      {selectedException.assignedReviewer}
                    </strong>
                  </div>
                  <div className="col-span-2 text-[#6B7280]">
                    Detected: <span className="font-mono text-[#374151]">{selectedException.detectionTimestamp}</span>
                  </div>
                </div>

                {/* Resolution / Dismissal Note */}
                {selectedException.resolutionNote && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-950 text-[11px]">
                    <strong>Resolution Note:</strong> {selectedException.resolutionNote}
                  </div>
                )}
                {selectedException.dismissalReason && (
                  <div className="p-2.5 bg-[#F3F4F6] border border-[#E5E7EB] rounded-md text-[#374151] text-[11px]">
                    <strong>Dismissal Justification:</strong> {selectedException.dismissalReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                  <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
                    Take Review Action
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('resolve');
                        setActionNote('Verified against institutional quota register; rectified.');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                    >
                      Resolve Issue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('escalate');
                        setActionNote('Escalating for formal council inquiry due to persistent capacity non-compliance.');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors cursor-pointer"
                    >
                      Escalate to Case
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('assign')}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#2457D6] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                    >
                      Assign Reviewer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('dismiss');
                        setActionNote('Deemed within permissible lateral entry / migration allowance.');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#4B5563] bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-md transition-colors cursor-pointer"
                    >
                      Dismiss with Reason
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Action Execution Modal */}
      {actionType && selectedException && (
        <div className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-md w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">
              {actionType === 'resolve'
                ? 'Resolve Validation Exception'
                : actionType === 'dismiss'
                ? 'Dismiss Exception with Documented Reason'
                : actionType === 'assign'
                ? 'Assign Reviewer'
                : 'Escalate to Formal Audit Case'}
            </h3>

            <p className="text-xs text-[#6B7280]">
              Target: <strong className="font-mono text-[#111827]">{selectedException.id}</strong> ({selectedException.institutionName})
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              {actionType === 'assign' ? (
                <div>
                  <label className="block font-medium text-[#374151] mb-1">Select Reviewer</label>
                  <select
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6]"
                  >
                    <option value="Dr. Anita Joshi (AICTE Analyst)">Dr. Anita Joshi (AICTE Analyst)</option>
                    <option value="V. Sundaram (Auditor)">V. Sundaram (Auditor)</option>
                    <option value="Regional Officer (West)">Regional Officer (West)</option>
                    <option value="Regulatory Desk (South)">Regulatory Desk (South)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    {actionType === 'dismiss'
                      ? 'Mandatory Reason for Dismissal'
                      : 'Resolution / Escalation Justification'}
                  </label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6] text-xs text-[#111827]"
                    placeholder="Document regulatory justification..."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs cursor-pointer"
                >
                  Confirm & Update State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
