import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCheck,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ValidationException, ExceptionSeverity, ExceptionStatus } from '../../types';

export const ExceptionsView: React.FC = () => {
  const { exceptions, resolveException, dismissException, assignException, escalateException, settings } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); // active by default
  const [selectedException, setSelectedException] = useState<ValidationException | null>(null);

  // Modal actions
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | 'assign' | 'escalate' | null>(null);
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

  // Handle Action Submit
  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedException) return;

    if (actionType === 'resolve') {
      if (!actionNote.trim()) return;
      resolveException(selectedException.id, actionNote.trim());
    } else if (actionType === 'dismiss') {
      if (!actionNote.trim()) return;
      dismissException(selectedException.id, actionNote.trim());
    } else if (actionType === 'assign') {
      assignException(selectedException.id, assigneeName);
    } else if (actionType === 'escalate') {
      if (!actionNote.trim()) return;
      escalateException(selectedException.id, actionNote.trim());
    }

    setActionType(null);
    setActionNote('');
    // refresh selectedException view
    const updated = exceptions.find((ex) => ex.id === selectedException.id);
    if (updated) setSelectedException(updated);
  };

  // Metrics
  const blockingCount = exceptions.filter((e) => e.severity === 'Blocking Error' && e.status !== 'Resolved' && e.status !== 'Dismissed').length;
  const warningCount = exceptions.filter((e) => e.severity === 'Warning' && e.status !== 'Resolved' && e.status !== 'Dismissed').length;
  const reviewCount = exceptions.filter((e) => e.severity === 'Review Required' && e.status !== 'Resolved' && e.status !== 'Dismissed').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Validation & Exceptions Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational triage queue for capacity overruns, cross-institution duplicate enrolments, and data integrity violations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
            <span className="font-bold font-mono">{blockingCount}</span> Blocking
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-medium">
            <span className="font-bold font-mono">{warningCount}</span> Warnings
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-medium">
            <span className="font-bold font-mono">{reviewCount}</span> Review Req
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search exception ID, institution, rule, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by severity"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="Blocking Error">Blocking Error (Capacity / Collision)</option>
              <option value="Warning">Warning</option>
              <option value="Review Required">Review Required</option>
              <option value="Informational">Informational</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="active">Active Issues (Excl. Closed)</option>
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Exceptions List & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exceptions List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
                <tr>
                  <th className="px-4 py-3">Exception ID</th>
                  <th className="px-4 py-3">Severity & Rule</th>
                  <th className="px-4 py-3">Institution & Violation</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No validation exceptions matched your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((ex) => {
                    const isSelected = selectedException?.id === ex.id;
                    return (
                      <tr
                        key={ex.id}
                        onClick={() => setSelectedException(ex)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          {ex.id}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded inline-block ${
                              ex.severity === 'Blocking Error'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : ex.severity === 'Warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : ex.severity === 'Review Required'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {ex.severity}
                          </span>
                          <div className="font-mono text-[10px] text-slate-400 mt-1">{ex.ruleId}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-medium text-slate-900 truncate">{ex.institutionName}</div>
                          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{ex.reason}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="truncate max-w-[120px]">{ex.assignedReviewer}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                              ex.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ex.status === 'Dismissed'
                                ? 'bg-slate-100 text-slate-600'
                                : ex.status === 'Escalated'
                                ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {ex.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Exception Detail & Action Panel */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          {!selectedException ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>Select an exception from the queue to inspect details, evidence, and apply actions.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Header */}
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedException.id}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      selectedException.severity === 'Blocking Error'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedException.severity}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mt-1">{selectedException.institutionName}</h3>
                <p className="text-[11px] text-slate-500">{selectedException.programmeName} · AY {selectedException.academicYear}</p>
              </div>

              {/* Reason & Evidence */}
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Detection Reason</span>
                  <p className="text-slate-800 font-medium mt-0.5">{selectedException.reason}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Supporting Evidence</span>
                  <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                    {selectedException.evidence}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Suggested Regulatory Action</span>
                  <p className="text-blue-800 mt-0.5 bg-blue-50/60 p-2.5 rounded border border-blue-200">
                    {selectedException.suggestedAction}
                  </p>
                </div>
              </div>

              {/* Status & Reviewer Info */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400">Status:</span>{' '}
                  <strong className="text-slate-800">{selectedException.status}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Reviewer:</span>{' '}
                  <strong className="text-slate-800 truncate block">{selectedException.assignedReviewer}</strong>
                </div>
                <div className="col-span-2 text-slate-400">
                  Detected: <span className="font-mono text-slate-600">{selectedException.detectionTimestamp}</span>
                </div>
              </div>

              {/* Resolution / Dismissal Note if applicable */}
              {selectedException.resolutionNote && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                  <strong>Resolution Note:</strong> {selectedException.resolutionNote}
                </div>
              )}
              {selectedException.dismissalReason && (
                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded text-slate-700 text-[11px]">
                  <strong>Dismissal Justification:</strong> {selectedException.dismissalReason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Take Review Action</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActionType('resolve');
                      setActionNote('Verified against institutional quota register; rectified.');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                  >
                    Resolve Issue
                  </button>
                  <button
                    onClick={() => {
                      setActionType('escalate');
                      setActionNote('Escalating for formal council inquiry due to persistent capacity non-compliance.');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
                  >
                    Escalate to Case
                  </button>
                  <button
                    onClick={() => {
                      setActionType('assign');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                  >
                    Assign Reviewer
                  </button>
                  <button
                    onClick={() => {
                      setActionType('dismiss');
                      setActionNote('Deemed within permissible lateral entry / migration allowance.');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
                  >
                    Dismiss with Reason
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Execution Modal */}
      {actionType && selectedException && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {actionType === 'resolve'
                ? 'Resolve Validation Exception'
                : actionType === 'dismiss'
                ? 'Dismiss Exception with Documented Reason'
                : actionType === 'assign'
                ? 'Assign Reviewer'
                : 'Escalate to Formal Audit Case'}
            </h3>

            <p className="text-xs text-slate-500">
              Target: <strong className="text-slate-800">{selectedException.id}</strong> ({selectedException.institutionName})
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              {actionType === 'assign' ? (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Reviewer</label>
                  <select
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Dr. Anita Joshi (AICTE Analyst)">Dr. Anita Joshi (AICTE Analyst)</option>
                    <option value="V. Sundaram (Auditor)">V. Sundaram (Auditor)</option>
                    <option value="Regional Officer (West)">Regional Officer (West)</option>
                    <option value="Regulatory Desk (South)">Regulatory Desk (South)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {actionType === 'dismiss' ? 'Mandatory Reason for Dismissal' : 'Resolution / Escalation Justification'}
                  </label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Document regulatory justification..."
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
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
