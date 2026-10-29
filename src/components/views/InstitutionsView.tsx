import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionDetailDrawer } from './InstitutionDetailDrawer';
import { Institution } from '../../types';

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
  const { institutions, createAuditCase, getInstitutionRisk } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'code' | 'intake' | 'enrolment' | 'priority'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drawer & Case Creation state
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(() => {
    if (initialSelectedId) {
      return institutions.find((i) => i.id === initialSelectedId) || null;
    }
    return null;
  });

  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [caseTargetInstId, setCaseTargetInstId] = useState<string>('');
  const [casePriority, setCasePriority] = useState<'Urgent' | 'High' | 'Normal' | 'Low'>('High');
  const [caseSummary, setCaseSummary] = useState('');

  // Extract unique states & types
  const states = useMemo(() => Array.from(new Set(institutions.map((i) => i.state))).sort(), [institutions]);
  const types = useMemo(() => Array.from(new Set(institutions.map((i) => i.type))).sort(), [institutions]);

  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const risk = getInstitutionRisk(inst.id);
      const matchesSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = selectedState === 'all' || inst.state === selectedState;
      const matchesType = selectedType === 'all' || inst.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || inst.submissionStatus === selectedStatus;
      const matchesPriority =
        selectedPriority === 'all' ||
        (selectedPriority === 'High' && risk.tier === 'High') ||
        (selectedPriority === 'Moderate' && risk.tier === 'Moderate') ||
        (selectedPriority === 'Low' && risk.tier === 'Low');

      return matchesSearch && matchesState && matchesType && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      let comparison = 0;
      const riskA = getInstitutionRisk(a.id);
      const riskB = getInstitutionRisk(b.id);

      if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'code') comparison = a.code.localeCompare(b.code);
      else if (sortField === 'intake') comparison = a.approvedIntake - b.approvedIntake;
      else if (sortField === 'enrolment') comparison = a.reportedEnrolment - b.reportedEnrolment;
      else if (sortField === 'priority') comparison = riskA.effectiveScore - riskB.effectiveScore;

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [institutions, searchQuery, selectedState, selectedType, selectedStatus, selectedPriority, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleOpenCaseModal = (institutionId: string) => {
    setCaseTargetInstId(institutionId);
    const inst = institutions.find((i) => i.id === institutionId);
    setCaseSummary(
      inst
        ? `Inquiry into reported enrolment discrepancy and admission compliance for ${inst.name}.`
        : ''
    );
    setNewCaseModalOpen(true);
  };

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTargetInstId || !caseSummary.trim()) return;

    createAuditCase(caseTargetInstId, casePriority, caseSummary.trim(), [
      'Initiated from Institutions Directory',
    ]);
    setNewCaseModalOpen(false);
    onNavigateToCases();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Approved Institutions Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of AICTE-sanctioned technical institutes with real-time intake discrepancy & review priority indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            Showing <strong className="text-slate-900">{filteredInstitutions.length}</strong> of {institutions.length} institutions
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by institution name, code, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              aria-label="Filter by state"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All States ({states.length})</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by institution type"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Institution Types</option>
              {types.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter by review priority"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Priority Levels</option>
              <option value="High">High Priority (70+)</option>
              <option value="Moderate">Moderate Priority (40-69)</option>
              <option value="Low">Low Priority (&lt;40)</option>
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
                <th className="px-4 py-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1.5">
                    <span>AICTE Code</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Institution Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">State & Type</th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('intake')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Approved Intake</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('enrolment')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Reported Enrolment</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Capacity Utilization</th>
                <th className="px-4 py-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1.5">
                    <span>Review Priority</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Submission Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No institutions matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const risk = getInstitutionRisk(inst.id);
                  const excess = inst.reportedEnrolment - inst.approvedIntake;
                  const utilizationPct = inst.approvedIntake > 0 ? (inst.reportedEnrolment / inst.approvedIntake) * 100 : 0;
                  const isOverrun = excess > 0;

                  return (
                    <tr
                      key={inst.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => setSelectedInstitution(inst)}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-600">
                        {inst.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="truncate max-w-xs">{inst.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {inst.approvedProgrammesCount} Approved Programmes · AY {inst.academicYear}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{inst.state}</div>
                        <div className="text-[11px] text-slate-400">{inst.type}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 font-medium">
                        {inst.approvedIntake}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold">
                        <span className={isOverrun ? 'text-rose-600' : 'text-slate-900'}>
                          {inst.reportedEnrolment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                            <span className={isOverrun ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                              {utilizationPct.toFixed(1)}%
                            </span>
                            {isOverrun ? (
                              <span className="text-rose-600 font-semibold">+{excess} seats</span>
                            ) : (
                              <span className="text-slate-400">Quota ok</span>
                            )}
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOverrun ? 'bg-rose-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(100, utilizationPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs tabular-nums ${
                              risk.tier === 'High'
                                ? 'text-rose-700'
                                : risk.tier === 'Moderate'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {risk.effectiveScore}/100
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              risk.tier === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : risk.tier === 'Moderate'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {risk.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium inline-block ${
                            inst.submissionStatus === 'Submitted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inst.submissionStatus === 'Discrepancy Detected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inst.submissionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedInstitution(inst)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
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
      </div>

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

      {/* New Audit Case Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Open Regulatory Audit Case</h3>
            <p className="text-xs text-slate-500">
              Instantiate formal inquiry case with assigned reviewer, timeline tracking, and institutional clarification requests.
            </p>
            <form onSubmit={handleCreateCaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Institution</label>
                <select
                  value={caseTargetInstId}
                  onChange={(e) => setCaseTargetInstId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block font-medium text-slate-700 mb-1">Audit Priority</label>
                <select
                  value={casePriority}
                  onChange={(e) => setCasePriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Urgent">Urgent (Immediate Showcause)</option>
                  <option value="High">High (7-Day Notice)</option>
                  <option value="Normal">Normal (Routine Inquiry)</option>
                  <option value="Low">Low (Advisory Check)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Inquiry Terms & Summary</label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Open Case & Notify Reviewer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
