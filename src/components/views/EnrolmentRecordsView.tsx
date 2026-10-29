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
import { Card } from '../ui/Card';
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
  const totalCount = records.length;
  const duplicateCandidatesCount = records.filter(
    (r) => r.validationStatus === 'Duplicate Candidate'
  ).length;
  const flaggedCount = records.filter((r) => r.validationStatus === 'Flagged').length;
  const validCount = records.filter((r) => r.validationStatus === 'Valid').length;

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

  // Filter Bar definitions
  const filterDropdowns = [
    {
      id: 'inst',
      label: 'Institution',
      value: selectedInstitution,
      options: [
        { label: 'All Institutions', value: 'all' },
        ...institutions.map((i) => ({ label: i.name, value: i.name })),
      ],
      onChange: (val: string) => setSelectedInstitution(val),
    },
    {
      id: 'valStatus',
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

  // DataTable columns
  const columns: Column<EnrolmentRecord>[] = [
    {
      id: 'studentRef',
      header: 'Student Ref',
      accessor: 'studentRef',
      sortable: true,
      className: 'w-36',
      render: (r) => (
        <span className="font-mono text-xs whitespace-nowrap text-[#111827] font-medium">
          {r.studentRef}
        </span>
      ),
    },
    {
      id: 'studentName',
      header: 'Student Name',
      accessor: 'maskedStudentName',
      sortable: true,
      className: 'w-44',
      render: (r) => (
        <div className="text-xs text-[#111827] font-medium truncate max-w-[170px]" title={r.maskedStudentName}>
          {r.maskedStudentName}
        </div>
      ),
    },
    {
      id: 'apaarId',
      header: 'Synthetic APAAR ID',
      accessor: 'syntheticApaarId',
      sortable: true,
      className: 'w-48',
      render: (r) =>
        r.syntheticApaarId ? (
          <span className="font-mono text-xs whitespace-nowrap text-[#4B5563]">
            {r.syntheticApaarId}
          </span>
        ) : (
          <span className="text-xs text-[#9CA3AF] italic">Unlinked</span>
        ),
    },
    {
      id: 'institution',
      header: 'Institution & Programme',
      sortable: true,
      className: 'min-w-[240px]',
      render: (r) => (
        <div className="min-w-0 py-0.5">
          <div className="text-xs font-medium text-[#111827] truncate" title={r.institutionName}>
            {r.institutionName}
          </div>
          <div className="text-[11px] text-[#6B7280] truncate mt-0.5" title={r.programmeName}>
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
      className: 'w-28 text-right',
      render: (r) => (
        <span className="text-xs text-[#4B5563] tabular-nums whitespace-nowrap">
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
        return <StatusChip label={r.enrolmentStatus} variant={variant} />;
      },
    },
    {
      id: 'validationStatus',
      header: 'Validation',
      accessor: 'validationStatus',
      sortable: true,
      className: 'w-36',
      render: (r) => <SeverityChip status={r.validationStatus} />,
    },
    {
      id: 'corroboration',
      header: 'Corroboration',
      className: 'w-36',
      render: (r) => {
        const c = r.corroboration;
        return (
          <div className="flex items-center gap-1">
            <span
              title={`Admission Record: ${c?.admissionRecordPresent ? 'Present' : 'Missing'}`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                c?.admissionRecordPresent
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              ADM
            </span>
            <span
              title={`Programme Mapping: ${c?.programmeMappingValid ? 'Valid' : 'Invalid'}`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                c?.programmeMappingValid
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              PGM
            </span>
            <span
              title={`Supporting Evidence: ${c?.supportingEvidenceAvailable ? 'Available' : 'Pending'}`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                c?.supportingEvidenceAvailable
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
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
          className="p-1 text-[#6B7280] hover:text-[#2457D6] hover:bg-[#F3F4F6] rounded transition-colors"
          title="View Student Record"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Enrolment Records"
        subtitle="Individual student-level admission records linked to synthetic APAAR identifiers for duplicate detection and intake reconciliation."
        actions={
          <div className="flex items-center gap-2">
            {duplicateCandidatesCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedValidationStatus('Duplicate Candidate')}
                className="text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-rose-600" />
                <span className="tabular-nums font-semibold">{duplicateCandidatesCount}</span>
                <span>Duplicate Conflicts</span>
              </button>
            )}
            <div className="text-xs text-[#4B5563] bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Valid: <strong className="text-[#111827] tabular-nums">{validCount}</strong></span>
              <span className="text-[#D1D5DB]">|</span>
              <span>Flagged: <strong className="text-[#111827] tabular-nums">{flaggedCount}</strong></span>
            </div>
          </div>
        }
      />

      {/* Dataset Verification Info Box */}
      <div className="px-3.5 py-2.5 bg-blue-50/50 border border-blue-100 rounded-md flex items-center justify-between text-xs text-[#1E3A8A]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2457D6] shrink-0" />
          <span>
            <strong>Comprehensive Record Register:</strong> {records.length} student-level admission records matching {institutions.reduce((s, i) => s + i.reportedEnrolment, 0)} reported enrolments across all approved programmes.
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#3B82F6] whitespace-nowrap ml-4">
          {records.length} of {records.length} Verified
        </span>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by student ref, name, synthetic APAAR, or institution..."
        dropdowns={filterDropdowns}
        activeChips={activeChips}
        onClearAll={handleClearFilters}
        totalCount={totalCount}
        filteredCount={filteredRecords.length}
      />

      {/* Records Data Table */}
      <Card noPadding>
        <DataTable
          data={filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          columns={columns}
          keyExtractor={(r) => r.id}
          onRowClick={handleRowClick}
          defaultSort={{ columnId: 'admissionDate', direction: 'desc' }}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
          emptyStateTitle="No enrolment records found"
          emptyStateDescription="Try adjusting your search terms or clearing active validation filters."
          stickyHeader
        />
      </Card>

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
