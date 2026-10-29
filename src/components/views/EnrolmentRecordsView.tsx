import React, { useState, useMemo } from 'react';
import {
  Users,
  Copy,
  ShieldCheck,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EnrolmentRecord, EnrolmentStatus, RecordValidationStatus } from '../../types';
import { RecordDetailDrawer } from './RecordDetailDrawer';
import { PageHeader } from '../ui/PageHeader';
import { DataTable, Column } from '../ui/DataTable';
import { FilterBar } from '../ui/FilterBar';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

interface EnrolmentRecordsViewProps {
  initialInstitutionFilter?: string | null;
  onClearInitialFilter?: () => void;
  onSelectRecord?: (record: EnrolmentRecord) => void;
}

export const EnrolmentRecordsView: React.FC<EnrolmentRecordsViewProps> = ({
  initialInstitutionFilter,
  onClearInitialFilter,
  onSelectRecord: externalOnSelectRecord,
}) => {
  const { records, institutions } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>(
    initialInstitutionFilter || 'all'
  );
  const [selectedValidationStatus, setSelectedValidationStatus] = useState<string>('all');
  const [selectedLifecycleStatus, setSelectedLifecycleStatus] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<EnrolmentRecord | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Metric counts
  const duplicateCandidatesCount = records.filter(
    (r) => r.validationStatus === 'Duplicate Candidate'
  ).length;

  const handleRowClick = (record: EnrolmentRecord) => {
    setSelectedRecord(record);
    if (externalOnSelectRecord) {
      externalOnSelectRecord(record);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedInstitution('all');
    setSelectedValidationStatus('all');
    setSelectedLifecycleStatus('all');
    if (onClearInitialFilter) onClearInitialFilter();
  };

  // Filter Bar dropdown configs
  const filterDropdowns = [
    {
      id: 'institution',
      label: 'Institution',
      value: selectedInstitution,
      options: [
        { label: 'All Institutions', value: 'all' },
        ...institutions.map((i) => ({ label: i.name, value: i.id })),
      ],
      onChange: (val: string) => setSelectedInstitution(val),
    },
    {
      id: 'validation',
      label: 'Validation Status',
      value: selectedValidationStatus,
      options: [
        { label: 'All Validation Statuses', value: 'all' },
        { label: 'Valid', value: 'Valid' },
        { label: 'Duplicate Candidate', value: 'Duplicate Candidate' },
        { label: 'Flagged', value: 'Flagged' },
      ],
      onChange: (val: string) => setSelectedValidationStatus(val),
    },
    {
      id: 'lifecycle',
      label: 'Lifecycle Status',
      value: selectedLifecycleStatus,
      options: [
        { label: 'All Enrolment Statuses', value: 'all' },
        { label: 'Active', value: 'Active' },
        { label: 'Pending Review', value: 'Pending Review' },
        { label: 'Withdrawn', value: 'Withdrawn' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Transferred', value: 'Transferred' },
        { label: 'Superseded', value: 'Superseded' },
      ],
      onChange: (val: string) => setSelectedLifecycleStatus(val),
    },
  ];

  const activeChips = [];
  if (selectedInstitution !== 'all') {
    activeChips.push({
      label: `Institution: ${selectedInstitution}`,
      onRemove: () => {
        setSelectedInstitution('all');
        if (onClearInitialFilter) onClearInitialFilter();
      },
    });
  }
  if (selectedValidationStatus !== 'all') {
    activeChips.push({
      label: `Validation: ${selectedValidationStatus}`,
      onRemove: () => setSelectedValidationStatus('all'),
    });
  }
  if (selectedLifecycleStatus !== 'all') {
    activeChips.push({
      label: `Lifecycle: ${selectedLifecycleStatus}`,
      onRemove: () => setSelectedLifecycleStatus('all'),
    });
  }

  // DataTable columns according to Part 1 & Part 6:
  // Primary cell: Student Ref (bold 14px mono) with Masked Name stacked beneath in muted 12px
  // Highlight only genuinely actionable rows (Duplicate candidate, Flagged)
  const columns: Column<EnrolmentRecord>[] = [
    {
      id: 'studentRef',
      header: 'Student Ref',
      accessor: 'studentRef',
      sortable: true,
      className: 'min-w-[180px]',
      render: (r) => {
        const isDuplicate = r.validationStatus === 'Duplicate Candidate';
        const isFlagged = r.validationStatus === 'Flagged';
        return (
          <div className="py-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-sm font-bold whitespace-nowrap ${
                  isDuplicate ? 'text-rose-600' : isFlagged ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {r.studentRef}
              </span>
              {isDuplicate && (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                  Duplicate
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">
              {r.maskedStudentName} · {r.gender} ({r.category})
            </div>
          </div>
        );
      },
    },
    {
      id: 'apaarId',
      header: 'Synthetic APAAR ID',
      accessor: 'syntheticApaarId',
      sortable: true,
      className: 'w-44',
      render: (r) =>
        r.syntheticApaarId ? (
          <span className="font-mono text-xs whitespace-nowrap text-slate-700">
            {r.syntheticApaarId}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Unlinked</span>
        ),
    },
    {
      id: 'institution',
      header: 'Institution & Programme',
      sortable: true,
      className: 'min-w-[240px]',
      render: (r) => (
        <div className="min-w-0 py-1">
          <div className="text-sm font-semibold text-slate-900 truncate" title={r.institutionName}>
            {r.institutionName}
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5" title={r.programmeName}>
            {r.programmeName}
          </div>
        </div>
      ),
    },
    {
      id: 'admissionDate',
      header: 'Admission Date',
      accessor: 'admissionDate',
      sortable: true,
      className: 'w-32 text-right',
      render: (r) => (
        <span className="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
          {r.admissionDate}
        </span>
      ),
    },
    {
      id: 'enrolmentStatus',
      header: 'Lifecycle',
      accessor: 'enrolmentStatus',
      sortable: true,
      className: 'w-28',
      render: (r) => {
        const variant =
          r.enrolmentStatus === 'Active'
            ? 'success'
            : r.enrolmentStatus === 'Pending Review'
            ? 'warning'
            : r.enrolmentStatus === 'Cancelled'
            ? 'danger'
            : 'neutral';
        return <StatusChip label={r.enrolmentStatus} variant={variant} size="sm" />;
      },
    },
    {
      id: 'validationStatus',
      header: 'Validation',
      accessor: 'validationStatus',
      sortable: true,
      className: 'w-36',
      render: (r) => <SeverityChip severity={r.validationStatus} size="sm" />,
    },
    {
      id: 'corroboration',
      header: 'Corroboration',
      className: 'w-32',
      render: (r) => {
        const c = r.corroboration;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span
              title={`Admission Record: ${c?.admissionRecordPresent ? 'Present' : 'Missing'}`}
              className={`px-1.5 py-0.5 rounded ${
                c?.admissionRecordPresent
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              ADM
            </span>
            <span
              title={`Programme Mapping: ${c?.programmeMappingValid ? 'Valid' : 'Invalid'}`}
              className={`px-1.5 py-0.5 rounded ${
                c?.programmeMappingValid
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              PGM
            </span>
            <span
              title={`Supporting Evidence: ${c?.supportingEvidenceAvailable ? 'Available' : 'Pending'}`}
              className={`px-1.5 py-0.5 rounded ${
                c?.supportingEvidenceAvailable
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              EVD
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'w-16 text-right',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(r);
          }}
          className="p-1 text-slate-500 hover:text-[#2457D6] hover:bg-slate-100 rounded transition-colors cursor-pointer"
          title="View Student Record"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header (No redundant count badges, action on right) */}
      <PageHeader
        title="Enrolment Records"
        subtitle="Individual student-level admission records linked to synthetic APAAR identifiers for duplicate detection."
        actions={
          duplicateCandidatesCount > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedValidationStatus(selectedValidationStatus === 'Duplicate Candidate' ? 'all' : 'Duplicate Candidate')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedValidationStatus === 'Duplicate Candidate'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="tabular-nums">{duplicateCandidatesCount}</span>
              <span>Duplicate Conflicts</span>
            </button>
          ) : null
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by student ref, synthetic APAAR, or student name..."
        dropdowns={filterDropdowns}
        activeChips={activeChips}
        onClearAll={handleClearFilters}
        totalCount={records.length}
        filteredCount={filteredRecords.length}
      />

      {/* Records Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        keyExtractor={(r) => r.id}
        onRowClick={handleRowClick}
        selectedId={selectedRecord?.id}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredRecords.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        emptyStateTitle="No matching student records found"
        emptyStateDescription="Try resetting your filters or search query to view all 70 records."
        stickyHeader
      />

      {/* Record Detail Drawer */}
      {selectedRecord && (
        <RecordDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
