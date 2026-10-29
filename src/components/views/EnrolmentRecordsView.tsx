import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EnrolmentRecord, EnrolmentStatus, RecordValidationStatus } from '../../types';
import { RecordDetailDrawer } from './RecordDetailDrawer';

interface EnrolmentRecordsViewProps {
  initialInstitutionFilter?: string | null;
  onClearInitialFilter?: () => void;
}

export const EnrolmentRecordsView: React.FC<EnrolmentRecordsViewProps> = ({
  initialInstitutionFilter,
  onClearInitialFilter,
}) => {
  const { records, institutions } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>(
    initialInstitutionFilter || 'all'
  );
  const [selectedValidationStatus, setSelectedValidationStatus] = useState<string>('all');
  const [selectedLifecycleStatus, setSelectedLifecycleStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const [selectedRecord, setSelectedRecord] = useState<EnrolmentRecord | null>(null);

  // Sync if initialInstitutionFilter changes
  React.useEffect(() => {
    if (initialInstitutionFilter) {
      setSelectedInstitution(initialInstitutionFilter);
      setCurrentPage(1);
    }
  }, [initialInstitutionFilter]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.studentRef.toLowerCase().includes(q) ||
        r.syntheticApaarId.toLowerCase().includes(q) ||
        r.maskedStudentName.toLowerCase().includes(q) ||
        r.institutionName.toLowerCase().includes(q) ||
        r.programmeName.toLowerCase().includes(q);

      const matchesInst =
        selectedInstitution === 'all' ||
        r.institutionName.toLowerCase() === selectedInstitution.toLowerCase() ||
        r.institutionId === selectedInstitution;

      const matchesValStatus =
        selectedValidationStatus === 'all' || r.validationStatus === selectedValidationStatus;

      const matchesLifecycle =
        selectedLifecycleStatus === 'all' || r.enrolmentStatus === selectedLifecycleStatus;

      return matchesSearch && matchesInst && matchesValStatus && matchesLifecycle;
    });
  }, [records, searchQuery, selectedInstitution, selectedValidationStatus, selectedLifecycleStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Key stats
  const totalInView = filteredRecords.length;
  const duplicateCandidatesInView = filteredRecords.filter((r) => r.validationStatus === 'Duplicate Candidate').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Enrolment Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthetic student-level admission records linked to simulated APAAR identifiers for duplicate detection and intake reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {duplicateCandidatesInView > 0 && (
            <button
              onClick={() => {
                setSelectedValidationStatus('Duplicate Candidate');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{duplicateCandidatesInView} Duplicate Collisions</span>
            </button>
          )}
          <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            {records.length} Total Synthetic Records
          </span>
        </div>
      </div>

      {/* Pre-filter Notice banner if active */}
      {selectedInstitution !== 'all' && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtered by Institution:</span>
            <span>{selectedInstitution}</span>
          </div>
          <button
            onClick={() => {
              setSelectedInstitution('all');
              if (onClearInitialFilter) onClearInitialFilter();
            }}
            className="flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium"
          >
            <span>Clear Filter</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, APAAR, student, college..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Institution Filter */}
          <div>
            <select
              value={selectedInstitution}
              onChange={(e) => {
                setSelectedInstitution(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by institution"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Institutions ({institutions.length})</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          {/* Validation Status Filter */}
          <div>
            <select
              value={selectedValidationStatus}
              onChange={(e) => {
                setSelectedValidationStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by validation status"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Validation Statuses</option>
              <option value="Valid">Valid (Within Quota)</option>
              <option value="Flagged">Flagged for Review</option>
              <option value="Duplicate Candidate">Duplicate Candidate</option>
              <option value="Pending">Pending Validation</option>
            </select>
          </div>

          {/* Lifecycle Status Filter */}
          <div>
            <select
              value={selectedLifecycleStatus}
              onChange={(e) => {
                setSelectedLifecycleStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by lifecycle status"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Lifecycle Statuses</option>
              <option value="Active">Active</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Transferred">Transferred</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
              <tr>
                <th className="px-4 py-3">Student Ref</th>
                <th className="px-4 py-3">Synthetic APAAR ID</th>
                <th className="px-4 py-3">Student Mask</th>
                <th className="px-4 py-3">Institution & Programme</th>
                <th className="px-4 py-3">Admission Date</th>
                <th className="px-4 py-3">Lifecycle Status</th>
                <th className="px-4 py-3">Validation Status</th>
                <th className="px-4 py-3">Corroboration</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No enrolment records matched your criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isDup = r.validationStatus === 'Duplicate Candidate';
                  const isFlagged = r.validationStatus === 'Flagged';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                        isDup ? 'bg-rose-50/30' : isFlagged ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {r.studentRef}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{r.syntheticApaarId}</span>
                          {isDup && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Concurrent multi-institution collision" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{r.maskedStudentName}</div>
                        <div className="text-[10px] text-slate-400">{r.gender} · {r.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 truncate max-w-xs">{r.institutionName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{r.programmeName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                        {r.admissionDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium inline-block ${
                            r.enrolmentStatus === 'Active'
                              ? 'bg-slate-100 text-slate-700'
                              : r.enrolmentStatus === 'Withdrawn' || r.enrolmentStatus === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500 line-through'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.enrolmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium inline-block ${
                            r.validationStatus === 'Valid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.validationStatus === 'Duplicate Candidate'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.validationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-mono text-slate-500">
                          {r.corroboration.externalAdapterStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{paginatedRecords.length}</strong> of{' '}
            <strong className="text-slate-800">{filteredRecords.length}</strong> matching records
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Record Drawer */}
      {selectedRecord && (
        <RecordDetailDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
};
