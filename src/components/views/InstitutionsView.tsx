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

  // Columns definition
  const columns: ColumnDef<Institution>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '120px',
      sortable: true,
      render: (inst) => (
        <span className="font-mono text-xs text-[#4B5563] whitespace-nowrap">
          {inst.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Institution Name',
      sortable: true,
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        return (
          <div className="min-w-0 pr-2">
            <Tooltip content={inst.name}>
              <span className="font-medium text-xs text-[#111827] truncate block max-w-sm">
                {inst.name}
              </span>
            </Tooltip>
            <span className="text-[11px] text-[#6B7280]">
              {inst.approvedProgrammesCount} Programmes · AY {inst.academicYear}
            </span>
          </div>
        );
      },
    },
    {
      key: 'state_type',
      header: 'State & Type',
      width: '180px',
      render: (inst) => (
        <div className="whitespace-nowrap">
          <div className="font-medium text-xs text-[#111827]">{inst.state}</div>
          <div className="text-[11px] text-[#6B7280]">
            {inst.type === 'Private Unaided' ? (
              <Tooltip content="Private institution receiving no state grant-in-aid">
                <span className="cursor-help underline decoration-dotted">{inst.type}</span>
              </Tooltip>
            ) : (
              inst.type
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'intake',
      header: 'Quota',
      width: '80px',
      align: 'right',
      sortable: true,
      render: (inst) => (
        <span className="tabular-nums font-mono text-xs text-[#4B5563]">
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
          <span className={`tabular-nums font-mono text-xs font-semibold ${isOver ? 'text-rose-700' : 'text-[#111827]'}`}>
            {inst.reportedEnrolment}
          </span>
        );
      },
    },
    {
      key: 'utilization',
      header: 'Intake Utilization',
      width: '160px',
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        const pct = (inst.reportedEnrolment / inst.approvedIntake) * 100;
        const isOver = excess > 0;

        // Semantic utilization color:
        // neutral/blue below 100%, amber when exactly 100% or within tolerance, red strictly over quota
        const barColor = isOver
          ? 'bg-rose-600'
          : inst.reportedEnrolment === inst.approvedIntake
          ? 'bg-amber-500'
          : 'bg-[#2457D6]';

        return (
          <div className="w-full max-w-[140px] space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="tabular-nums font-mono text-[#6B7280]">{pct.toFixed(1)}%</span>
              {isOver ? (
                <span className="text-rose-700 font-semibold tabular-nums text-[11px]">+{excess} over</span>
              ) : (
                <span className="text-[#6B7280] text-[11px]">Within quota</span>
              )}
            </div>
            <div className="h-1.5 w-full bg-[#F3F4F6] rounded overflow-hidden">
              <div
                className={`h-full rounded ${barColor}`}
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
      width: '130px',
      sortable: true,
      render: (inst) => {
        const risk = getInstitutionRisk(inst.id);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold tabular-nums text-[#111827]">
              {risk.effectiveScore}
            </span>
            <SeverityChip severity={risk.tier} size="sm" />
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Submission Status',
      width: '140px',
      render: (inst) => {
        const excess = inst.reportedEnrolment - inst.approvedIntake;
        // Show over intake label strictly when over intake
        if (excess > 0) {
          return <StatusChip label="Over Intake" variant="danger" size="sm" />;
        }
        if (inst.submissionStatus === 'Late Submission') {
          return <StatusChip label="Late Submission" variant="warning" size="sm" />;
        }
        return <StatusChip label="Submitted" variant="success" size="sm" />;
      },
    },
    {
      key: 'action',
      header: '',
      width: '40px',
      align: 'right',
      render: () => (
        <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Approved Institutions"
        description="Comprehensive directory of AICTE-approved institutions with capacity utilization and explainable review priority scores."
      />

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search institution name, code, or state..."
        activeFilters={activeChips}
        onClearAll={handleClearAll}
        showingCount={filteredInstitutions.length}
        totalCount={institutions.length}
        densityToggle={
          <div className="flex items-center gap-1 border-l border-[#E5E7EB] pl-3 ml-2">
            <span className="text-[11px] text-[#6B7280]">Density:</span>
            <button
              type="button"
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
              className="text-xs px-2 py-0.5 rounded border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] font-medium"
            >
              {density === 'comfortable' ? 'Comfortable' : 'Compact'}
            </button>
          </div>
        }
      >
        {/* State Select */}
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by state"
          className="px-2.5 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2457D6] cursor-pointer"
        >
          <option value="all">All States ({states.length})</option>
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Type Select */}
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by institution type"
          className="px-2.5 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2457D6] cursor-pointer"
        >
          <option value="all">All Institution Types</option>
          {types.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>

        {/* Priority Select */}
        <select
          value={selectedPriority}
          onChange={(e) => {
            setSelectedPriority(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by review priority"
          className="px-2.5 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2457D6] cursor-pointer"
        >
          <option value="all">All Priority Tiers</option>
          <option value="High">High (&ge;70)</option>
          <option value="Moderate">Moderate (40–69)</option>
          <option value="Low">Low (&lt;40)</option>
        </select>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={paginatedInstitutions}
        keyExtractor={(i) => i.id}
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
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
      />

      {/* Selected Institution Drawer */}
      {selectedInstitution && (
        <InstitutionDetailDrawer
          institution={selectedInstitution}
          onClose={() => setSelectedInstitution(null)}
          onOpenCase={handleOpenCaseModal}
          onNavigateToRecords={(name) => {
            setSelectedInstitution(null);
            onNavigateToRecords(name);
          }}
        />
      )}

      {/* Open Case Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-md w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-semibold text-[#111827]">Open Regulatory Audit Case</h3>
            <form onSubmit={handleCreateCaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Target Institution</label>
                <select
                  value={caseTargetInstId}
                  onChange={(e) => setCaseTargetInstId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827]"
                  required
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Priority Classification</label>
                <select
                  value={casePriority}
                  onChange={(e) => setCasePriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827]"
                >
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Normal">Normal Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Inquiry Terms & Notes</label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  rows={3}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCaseModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md border border-[#E5E7EB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md"
                >
                  Open Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
