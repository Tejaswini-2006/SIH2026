import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCheck,
  Clock,
  ShieldAlert,
  Sliders,
  Eye,
  ShieldCheck,
  Info,
  Calendar,
  AlertCircle,
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
import { Tabs } from '../ui/Tabs';

export const ExceptionsView: React.FC = () => {
  const {
    exceptions,
    resolveException,
    dismissException,
    assignException,
    escalateException,
    auditTrail,
    settings,
  } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedException, setSelectedException] = useState<ValidationException | null>(
    exceptions[0] || null
  );
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'timeline'>('details');

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

  // Severity counts for summary strip
  const blockingTotal = exceptions.filter((e) => e.severity === 'Blocking Error').length;
  const warningTotal = exceptions.filter((e) => e.severity === 'Warning').length;
  const reviewTotal = exceptions.filter((e) => e.severity === 'Review Required').length;
  const infoTotal = exceptions.filter((e) => e.severity === 'Informational').length;

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

  // Sort blocking and unresolved to top by default
  const sortedExceptions = useMemo(() => {
    const severityRank: Record<string, number> = {
      'Blocking Error': 1,
      Warning: 2,
      'Review Required': 3,
      Informational: 4,
    };
    return [...filteredExceptions].sort((a, b) => {
      const aClosed = a.status === 'Resolved' || a.status === 'Dismissed';
      const bClosed = b.status === 'Resolved' || b.status === 'Dismissed';
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      const aRank = severityRank[a.severity] || 5;
      const bRank = severityRank[b.severity] || 5;
      if (aRank !== bRank) return aRank - bRank;
      return b.detectionTimestamp.localeCompare(a.detectionTimestamp);
    });
  }, [filteredExceptions]);

  // Sync selectedException
  React.useEffect(() => {
    if (sortedExceptions.length > 0) {
      if (!selectedException || !sortedExceptions.some((e) => e.id === selectedException.id)) {
        setSelectedException(sortedExceptions[0]);
      }
    }
  }, [sortedExceptions, selectedException]);

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

  // Columns in exact Part 4 order:
  // 1. Severity (icon + chip)
  // 2. Exception ID (mono, bold)
  // 3. Reason (short, truncated to one line with tooltip)
  // 4. Institution (primary 14px bold) with programme muted (12px) below
  // 5. Status
  // 6. Assigned
  // 7. Detected
  const columns: Column<ValidationException>[] = [
    {
      id: 'severity',
      header: 'Severity',
      accessor: 'severity',
      className: 'w-36',
      render: (ex) => {
        const isClosed = ex.status === 'Resolved' || ex.status === 'Dismissed';
        return <SeverityChip severity={ex.severity} muted={isClosed} size="sm" />;
      },
    },
    {
      id: 'id',
      header: 'Exception ID',
      accessor: 'id',
      sortable: true,
      className: 'w-28',
      render: (ex) => {
        const isClosed = ex.status === 'Resolved' || ex.status === 'Dismissed';
        return (
          <span
            className={`font-mono text-xs whitespace-nowrap font-bold ${
              isClosed ? 'text-slate-400' : 'text-slate-900'
            }`}
          >
            {ex.id}
          </span>
        );
      },
    },
    {
      id: 'reason',
      header: 'Reason',
      className: 'min-w-[220px]',
      render: (ex) => {
        const isClosed = ex.status === 'Resolved' || ex.status === 'Dismissed';
        return (
          <div className="py-1">
            <p
              className={`text-xs leading-4 truncate max-w-sm ${
                isClosed ? 'text-slate-400' : 'text-slate-800 font-medium'
              }`}
              title={ex.reason}
            >
              {ex.reason}
            </p>
            <div className="font-mono text-xs text-slate-400 mt-0.5 truncate">{ex.ruleId}</div>
          </div>
        );
      },
    },
    {
      id: 'institution',
      header: 'Institution',
      sortable: true,
      className: 'min-w-[200px]',
      render: (ex) => {
        const isClosed = ex.status === 'Resolved' || ex.status === 'Dismissed';
        return (
          <div className="py-1">
            <div
              className={`text-sm leading-5 font-semibold truncate max-w-xs ${
                isClosed ? 'text-slate-500' : 'text-slate-900'
              }`}
            >
              {ex.institutionName}
            </div>
            <div className="text-xs leading-4 text-slate-500 truncate max-w-xs mt-0.5">
              {ex.programmeName}
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      className: 'w-28 text-left',
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
        return <StatusChip label={ex.status} variant={variant} size="sm" />;
      },
    },
    {
      id: 'assignedReviewer',
      header: 'Assigned',
      accessor: 'assignedReviewer',
      className: 'w-36',
      render: (ex) => (
        <span className="text-xs text-slate-600 truncate block max-w-[140px]" title={ex.assignedReviewer}>
          {ex.assignedReviewer}
        </span>
      ),
    },
    {
      id: 'detectionTimestamp',
      header: 'Detected',
      className: 'w-28 text-right',
      render: (ex) => (
        <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
          {ex.detectionTimestamp.slice(5, 10)} {ex.detectionTimestamp.slice(11, 16)}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Validation & Exceptions"
        subtitle="Priority triage queue for capacity overruns, cross-institution duplicate enrolments, and reporting violations."
      />

      {/* Summary Strip: Severity counts as large clickable filter chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setSelectedSeverity(selectedSeverity === 'Blocking Error' ? 'all' : 'Blocking Error')}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === 'Blocking Error'
              ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/50'
          }`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-800">Blocking Errors</div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">{blockingTotal}</div>
          </div>
          <span className="text-xs text-rose-600 font-semibold">Immediate</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity(selectedSeverity === 'Warning' ? 'all' : 'Warning')}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === 'Warning'
              ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/50'
          }`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">Warnings</div>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">{warningTotal}</div>
          </div>
          <span className="text-xs text-amber-600 font-medium">Overrun / Collision</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity(selectedSeverity === 'Review Required' ? 'all' : 'Review Required')}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === 'Review Required'
              ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/50'
          }`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">Review Required</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1 tabular-nums">{reviewTotal}</div>
          </div>
          <span className="text-xs text-blue-600 font-medium">Audit Sample</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeverity(selectedSeverity === 'Informational' ? 'all' : 'Informational')}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === 'Informational'
              ? 'bg-slate-200/80 border-slate-400 ring-2 ring-slate-500/20 shadow-xs'
              : 'bg-slate-100/70 border-slate-200 hover:bg-slate-200/50'
          }`}
        >
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">Informational</div>
            <div className="text-2xl font-bold font-mono text-slate-700 mt-1 tabular-nums">{infoTotal}</div>
          </div>
          <span className="text-xs text-slate-500">Advisory</span>
        </button>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <Card noPadding>
            <DataTable
              data={sortedExceptions}
              columns={columns}
              keyExtractor={(ex) => ex.id}
              selectedId={selectedException?.id}
              onRowClick={(ex) => setSelectedException(ex)}
              defaultPageSize={10}
              pageSizeOptions={[10, 20]}
              emptyStateTitle="No validation exceptions found"
              emptyStateDescription="Try adjusting your filter criteria to view closed or resolved items."
              stickyHeader
            />
          </Card>
        </div>

        {/* Selected Exception Inspection Panel */}
        <div className="lg:col-span-5">
          {!selectedException ? (
            <Card>
              <div className="py-20 text-center text-slate-400 text-xs">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select an exception from the queue to inspect details and apply actions.</p>
              </div>
            </Card>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-2xs divide-y divide-[#E5E7EB]">
              {/* Header: Exception ID in 24px bold + severity chip */}
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {selectedException.id}
                    </span>
                    <SeverityChip severity={selectedException.severity} size="md" />
                  </div>
                  <StatusChip label={selectedException.status} size="sm" />
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  Rule: {selectedException.ruleId} · AY {selectedException.academicYear}
                </div>

                {/* 1-sentence "What happened" summary in 16px font-semibold */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    What Happened
                  </span>
                  <p className="text-base leading-6 font-semibold text-slate-900">
                    {selectedException.reason}
                  </p>
                </div>

                {/* Institution & Target student */}
                <div className="mt-3 text-xs space-y-1">
                  <div className="text-sm font-semibold text-slate-800">
                    {selectedException.institutionName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Programme: <span className="font-medium text-slate-700">{selectedException.programmeName}</span>
                  </div>
                  {selectedException.affectedStudentRef && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-slate-500">Candidate:</span>
                      <span className="font-mono text-xs font-semibold text-[#2457D6] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedException.affectedStudentRef}
                      </span>
                      {selectedException.affectedApaar && (
                        <span className="font-mono text-xs text-slate-500">
                          (APAAR: {selectedException.affectedApaar})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Prominent "Suggested Next Action" Box */}
              <div className="p-5 bg-blue-50/60 border-l-4 border-l-[#2457D6]">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#2457D6] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-900">
                      Suggested Regulatory Action
                    </h4>
                    <p className="text-sm leading-5 font-semibold text-blue-950 mt-1">
                      {selectedException.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Facts strip */}
              <div className="p-5 grid grid-cols-2 gap-3 text-xs bg-slate-50/50">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Assigned Reviewer</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {selectedException.assignedReviewer}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Detection Time</span>
                  <span className="font-mono text-xs text-slate-700 mt-0.5 block">
                    {selectedException.detectionTimestamp}
                  </span>
                </div>
              </div>

              {/* Tabs for Evidence & Timeline */}
              <div className="p-5 space-y-3">
                <Tabs
                  tabs={[
                    { id: 'details', label: 'Evidence & Record' },
                    { id: 'timeline', label: 'Activity Timeline', count: selectedException.timeline?.length || 0 },
                  ]}
                  activeTab={activeDetailTab}
                  onChange={(id) => setActiveDetailTab(id as any)}
                />

                {activeDetailTab === 'details' ? (
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <span className="text-xs font-medium text-slate-500 block mb-1">
                        Supporting Evidence
                      </span>
                      <p className="bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs text-slate-700 leading-relaxed">
                        {selectedException.evidence}
                      </p>
                    </div>

                    {selectedException.resolutionNote && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900">
                        <span className="font-semibold block">Resolution Confirmation</span>
                        <p className="mt-0.5">{selectedException.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 text-xs">
                    {selectedException.timeline && selectedException.timeline.length > 0 ? (
                      <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1.5">
                        {selectedException.timeline.map((step, idx) => (
                          <div key={idx} className="relative pb-2">
                            <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#2457D6] ring-4 ring-white" />
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="font-semibold text-slate-800">{step.action}</span>
                              <span className="font-mono text-slate-400">{step.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {step.actor} {step.note && `— ${step.note}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No previous events logged.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Verbs, 1-3 words */}
              <div className="p-5 bg-slate-50/50 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('assign')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  Assign reviewer
                </button>

                {selectedException.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => setActionType('resolve')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
                  >
                    Resolve
                  </button>
                )}

                {selectedException.status !== 'Dismissed' && selectedException.status !== 'Resolved' && (
                  <button
                    type="button"
                    onClick={() => setActionType('dismiss')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}

                {selectedException.status !== 'Escalated' && (
                  <button
                    type="button"
                    onClick={() => setActionType('escalate')}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer ml-auto"
                  >
                    Escalate
                  </button>
                )}
              </div>

              {/* Action Modal Form */}
              {actionType && (
                <form onSubmit={handleActionSubmit} className="p-5 bg-amber-50/40 border-t border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                      {actionType === 'resolve' && 'Record Exception Resolution'}
                      {actionType === 'dismiss' && 'Record Dismissal Justification'}
                      {actionType === 'assign' && 'Assign Exception Reviewer'}
                      {actionType === 'escalate' && 'Escalate to Formal Council Docket'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {actionType === 'assign' ? (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Select Officer</label>
                      <input
                        type="text"
                        value={assigneeName}
                        onChange={(e) => setAssigneeName(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Auditor Note / Justification
                      </label>
                      <textarea
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Provide formal regulatory justification..."
                        rows={3}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2457D6]"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActionType(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md transition-colors"
                    >
                      Save action
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
