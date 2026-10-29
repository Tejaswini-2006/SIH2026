import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  PlusCircle,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Institution } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { FilterBar, ActiveFilterChip } from '../ui/FilterBar';
import { DataTable, ColumnDef, TableDensity } from '../ui/DataTable';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';
import { Tooltip } from '../ui/Tooltip';
import { InstitutionDetailDrawer } from './InstitutionDetailDrawer';
import { useToast } from '../ui/ToastContext';

interface InstitutionsViewProps {
  initialSelectedId?: string | null;
  onNavigateToRecords: (institutionName: string) => void;
  onNavigateToCases: () => void;
}

export const InstitutionsView: React.FC<InstitutionsViewProps> = ({
  initialSelectedId,
  onNavigateToRecords,
  onNavigateToCases,
}) => {
  const { institutions, getInstitutionRisk, createAuditCase, settings } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [density, setDensity] = useState<TableDensity>('comfortable');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected institution for drawer
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(() => {
    if (initialSelectedId) {
      return institutions.find((i) => i.id === initialSelectedId) || null;
    }
    return null;
  });

  // New Case Modal
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [caseTargetInstId, setCaseTargetInstId] = useState<string>('');
  const [casePriority, setCasePriority] = useState<'Urgent' | 'High' | 'Normal' | 'Low'>('High');
  const [caseSummary, setCaseSummary] = useState('');

  const states = useMemo(() => Array.from(new Set(institutions.map((i) => i.state))).sort(), [institutions]);
  const types = useMemo(() => Array.from(new Set(institutions.map((i) => i.type))).sort(), [institutions]);

  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const risk = getInstitutionRisk(inst.id);
      const matchesSearch =
        !searchQuery ||
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = selectedState === 'all' || inst.state === selectedState;
      const matchesType = selectedType === 'all' || inst.type === selectedType;
      const matchesPriority =
        selectedPriority === 'all' ||
        (selectedPriority === 'High' && risk.tier === 'High') ||
        (selectedPriority === 'Moderate' && risk.tier === 'Moderate') ||
        (selectedPriority === 'Low' && risk.tier === 'Low');

      return matchesSearch && matchesState && matchesType && matchesPriority;
    }).sort((a, b) => {
      let comp = 0;
      const riskA = getInstitutionRisk(a.id);
      const riskB = getInstitutionRisk(b.id);

      if (sortField === 'name') comp = a.name.localeCompare(b.name);
      else if (sortField === 'code') comp = a.code.localeCompare(b.code);
      else if (sortField === 'intake') comp = a.approvedIntake - b.approvedIntake;
      else if (sortField === 'enrolment') comp = a.reportedEnrolment - b.reportedEnrolment;
      else if (sortField === 'priority') comp = riskA.effectiveScore - riskB.effectiveScore;

      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [institutions, searchQuery, selectedState, selectedType, selectedPriority, sortField, sortDirection, getInstitutionRisk]);

  const paginatedInstitutions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInstitutions.slice(start, start + pageSize);
  }, [filteredInstitutions, currentPage, pageSize]);

  // Active filter chips
  const activeChips: ActiveFilterChip[] = [];
  if (selectedState !== 'all') {
    activeChips.push({
      id: 'state',
      label: 'State',
      value: selectedState,
      onRemove: () => setSelectedState('all'),
    });
  }
  if (selectedType !== 'all') {
    activeChips.push({
      id: 'type',
      label: 'Type',
      value: selectedType,
      onRemove: () => setSelectedType('all'),
    });
  }
  if (selectedPriority !== 'all') {
    activeChips.push({
      id: 'priority',
      label: 'Priority',
      value: selectedPriority,
      onRemove: () => setSelectedPriority('all'),
    });
  }

  const handleClearAll = () => {
    setSelectedState('all');
    setSelectedType('all');
    setSelectedPriority('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleOpenCaseModal = (instId: string) => {
    setCaseTargetInstId(instId);
    const target = institutions.find((i) => i.id === instId);
    setCaseSummary(target ? `Compliance review inquiry for ${target.name}.` : '');
    setNewCaseModalOpen(true);
  };

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTargetInstId || !caseSummary.trim()) return;

    createAuditCase(caseTargetInstId, casePriority, caseSummary.trim(), [
      'Inquiry opened from Institutions Directory',
    ]);
    showToast({ message: 'Audit case created successfully', type: 'success' });
    setNewCaseModalOpen(false);
    onNavigateToCases();
  };

  // Columns definition according to Part 1 & Part 6:
  // Primary cell: Institution name (14px font-semibold), secondary info stacked beneath in muted 12px
  // Highlight only genuinely actionable rows (over intake)
  const columns: ColumnDef<Institution>[] = [
    {
      key: 'name',
      header: 'Institution',
      sortable: true,
      className: 'min-w-[260px]',
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        const isOver = excess > 0;
        return (
          <div className="py-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold truncate block max-w-sm ${isOver ? 'text-slate-900' : 'text-slate-800'}`}>
                {inst.name}
              </span>
              {isOver && (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                  +{excess} excess
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-normal">
              <span className="font-mono text-slate-600">{inst.code}</span>
              <span>·</span>
              <span>{inst.state}</span>
              <span>·</span>
              <span>{inst.type}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'intake',
      header: 'Quota',
      width: '90px',
      align: 'right',
      sortable: true,
      render: (inst) => (
        <span className="tabular-nums font-mono text-xs text-slate-600">
          {inst.approvedIntake}
        </span>
      ),
    },
    {
      key: 'enrolment',
      header: 'Reported',
      width: '90px',
      align: 'right',
      sortable: true,
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        const isOver = excess > 0;
        return (
          <span className={`tabular-nums font-mono text-xs font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>
            {inst.reportedEnrolment}
          </span>
        );
      },
    },
    {
      key: 'utilization',
      header: 'Intake Utilization',
      width: '180px',
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        const pct = (inst.reportedEnrolment / inst.approvedIntake) * 100;
        const isOver = excess > 0;

        const barColor = isOver
          ? 'bg-rose-600'
          : inst.reportedEnrolment === inst.approvedIntake
          ? 'bg-amber-500'
          : 'bg-slate-300';

        return (
          <div className="w-full pr-2">
            <div className="flex items-center justify-between text-xs mb-1 tabular-nums font-medium">
              <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                {pct.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-400">
                {inst.reportedEnrolment}/{inst.approvedIntake} seats
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm ${barColor}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Review Priority',
      width: '150px',
      sortable: true,
      render: (inst) => {
        const risk = getInstitutionRisk(inst.id);
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                risk.tier === 'High'
                  ? 'text-rose-600'
                  : risk.tier === 'Moderate'
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {risk.effectiveScore}/100
            </span>
            <SeverityChip severity={risk.tier} size="sm" />
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'right',
      render: (inst) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInstitution(inst);
          }}
          className="text-xs font-semibold text-[#2457D6] hover:text-blue-800 flex items-center gap-0.5 ml-auto cursor-pointer"
        >
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header (Consolidated without decorative count box) */}
      <PageHeader
        title="Institutions"
        subtitle="Directory of AICTE-approved technical colleges, quota allocations, and reported admissions."
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by college name, code, or state..."
        dropdowns={[
          {
            id: 'state',
            label: 'State',
            value: selectedState,
            options: [
              { label: 'All States', value: 'all' },
              ...states.map((s) => ({ label: s, value: s })),
            ],
            onChange: setSelectedState,
          },
          {
            id: 'type',
            label: 'Management Type',
            value: selectedType,
            options: [
              { label: 'All Types', value: 'all' },
              ...types.map((t) => ({ label: t, value: t })),
            ],
            onChange: setSelectedType,
          },
          {
            id: 'priority',
            label: 'Risk Tier',
            value: selectedPriority,
            options: [
              { label: 'All Tiers', value: 'all' },
              { label: 'High Priority (70+)', value: 'High' },
              { label: 'Moderate Priority (40-69)', value: 'Moderate' },
              { label: 'Low Priority (<40)', value: 'Low' },
            ],
            onChange: setSelectedPriority,
          },
        ]}
        activeChips={activeChips}
        onClearAll={handleClearAll}
        totalCount={institutions.length}
        filteredCount={filteredInstitutions.length}
      />

      {/* Institutions Table */}
      <DataTable
        columns={columns}
        data={paginatedInstitutions}
        keyExtractor={(inst) => inst.id}
        onRowClick={(inst) => setSelectedInstitution(inst)}
        selectedId={selectedInstitution?.id}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        density={density}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredInstitutions.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20]}
        stickyHeader
      />

      {/* Institution Detail Drawer */}
      {selectedInstitution && (
        <InstitutionDetailDrawer
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onNavigateToRecords={onNavigateToRecords}
          onOpenCase={handleOpenCaseModal}
        />
      )}

      {/* New Audit Case Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateCaseSubmit}
            className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900">Open Audit Inquiry Docket</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target College</label>
              <select
                value={caseTargetInstId}
                onChange={(e) => setCaseTargetInstId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={casePriority}
                onChange={(e) => setCasePriority(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Inquiry Scope & Reason</label>
              <textarea
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewCaseModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md"
              >
                Create docket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
