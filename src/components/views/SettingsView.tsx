import React, { useState, useMemo } from 'react';
import {
  Settings,
  UserCheck,
  Calendar,
  Sliders,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Database,
  SlidersHorizontal,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { DemoRole, AcademicYear, RiskRuleWeights } from '../../types';
import { calculateInstitutionRisk, DEFAULT_RISK_WEIGHTS } from '../../utils/engine';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusChip } from '../ui/StatusChip';

type SettingsTab = 'roles' | 'cycle' | 'thresholds' | 'weights' | 'data';

export const SettingsView: React.FC = () => {
  const {
    settings,
    setRole,
    setAcademicYear,
    updateRuleWeights,
    updateTolerance,
    setActiveInstitutionForAdmin,
    resetAllData,
    institutions,
    records,
    exceptions,
    getInstitutionRisk,
  } = useApp();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('roles');
  const [weights, setWeights] = useState<RiskRuleWeights>(settings.ruleWeights);
  const [tolerance, setTolerance] = useState<number>(settings.intakeTolerancePercentage);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const roles: Array<{ role: DemoRole; desc: string; scope: string }> = [
    {
      role: 'AICTE Analyst',
      desc: 'Central council analyst tasked with statewide admission scrutiny, intake utilization monitoring, and validation exception triaging.',
      scope: 'Full cross-institution access, scoring weights, exceptions queue, report downloads',
    },
    {
      role: 'Institution Administrator',
      desc: 'College registrar or examination controller uploading annual student admission manifests and responding to regulatory notices.',
      scope: 'Restricted view to designated college, batch CSV submission, institutional response logs',
    },
    {
      role: 'Auditor',
      desc: 'High-level inquiry officer investigating cross-state duplicate candidates, capacity violations, and recording reasoned overrides.',
      scope: 'Deep inquiry cases, showcause issuances, priority overrides, council referral',
    },
  ];

  const totalWeight =
    weights.intakeOverrun +
    weights.duplicateEnrolment +
    weights.exceptionDensity +
    weights.lateSubmission +
    weights.corroborationGap;

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      showToast('Weights must sum to exactly 100%', 'error');
      return;
    }
    updateRuleWeights(weights);
    updateTolerance(tolerance);
    showToast('Saved engine weights and review parameters', 'success');
  };

  const handleDiscardWeights = () => {
    setWeights(settings.ruleWeights);
    setTolerance(settings.intakeTolerancePercentage);
    showToast('Discarded unsaved weight adjustments', 'neutral');
  };

  // Before & After preview calculation
  const beforeCounts = useMemo(() => {
    let high = 0,
      mod = 0,
      low = 0;
    institutions.forEach((inst) => {
      const r = getInstitutionRisk(inst.id);
      if (r.tier === 'High') high++;
      else if (r.tier === 'Moderate') mod++;
      else low++;
    });
    return { high, mod, low };
  }, [institutions, getInstitutionRisk]);

  const afterCounts = useMemo(() => {
    let high = 0,
      mod = 0,
      low = 0;
    institutions.forEach((inst) => {
      const simulated = calculateInstitutionRisk(inst, records, exceptions, weights);
      if (simulated.tier === 'High') high++;
      else if (simulated.tier === 'Moderate') mod++;
      else low++;
    });
    return { high, mod, low };
  }, [institutions, records, exceptions, weights]);

  const handleResetData = () => {
    resetAllData();
    setWeights(DEFAULT_RISK_WEIGHTS);
    setTolerance(0);
    setResetDialogOpen(false);
    showToast('All synthetic demo records, exceptions, and settings restored to default seed', 'info');
  };

  const tabs = [
    { id: 'roles', label: 'Role Simulation' },
    { id: 'cycle', label: 'Review Cycle & Intake Tolerance' },
    { id: 'thresholds', label: 'Validation Rules & Thresholds' },
    { id: 'weights', label: 'Risk Engine Weights' },
    { id: 'data', label: 'Data & Reset' },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Settings & Configuration"
        subtitle="Configure simulated personas, active review cycles, validation thresholds, and risk scoring rule parameters."
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as SettingsTab)} />

      {/* Tab 1: Roles */}
      {activeTab === 'roles' && (
        <Card
          title="Demo Persona / Role Simulator"
          subtitle="Select an active demo persona to preview role-tailored permissions and views (Simulation only; no production auth)."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {roles.map((r) => {
                const isSelected = settings.currentRole === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => {
                      setRole(r.role);
                      showToast(`Switched active role to ${r.role}`, 'info');
                    }}
                    className={`p-4 rounded-md border cursor-pointer transition-colors flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-[#2457D6] bg-blue-50/40 ring-1 ring-[#2457D6]'
                        : 'border-[#E5E7EB] hover:border-[#D1D5DB] bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111827]">{r.role}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2457D6]" />}
                      </div>
                      <p className="text-[11px] text-[#4B5563] mt-1.5 leading-relaxed">{r.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-[#E5E7EB] text-[10px] text-[#6B7280]">
                      {r.scope}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Institution Administrator specific mapping */}
            {settings.currentRole === 'Institution Administrator' && (
              <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-[#374151] font-medium">Designated Institution for Admin:</span>
                </div>
                <select
                  value={settings.activeInstitutionIdForAdmin}
                  onChange={(e) => {
                    setActiveInstitutionForAdmin(e.target.value);
                    showToast('Updated active institution scope for administrator', 'info');
                  }}
                  className="px-2.5 py-1 bg-white border border-[#D1D5DB] rounded-md font-medium text-[#111827] text-xs focus:outline-none focus:border-[#2457D6]"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 2: Cycle & Tolerance */}
      {activeTab === 'cycle' && (
        <Card
          title="Review Cycle & Tolerance Parameters"
          subtitle="Configure regulatory academic year and admission variance thresholds."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-[#374151]">Active Council Review Cycle</label>
              <select
                value={settings.activeAcademicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value as AcademicYear);
                  showToast(`Switched active review cycle to ${e.target.value}`, 'info');
                }}
                className="w-full px-3 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6] text-[#111827]"
              >
                <option value="2024-25">Academic Year 2024-25 (Current Active Cycle)</option>
                <option value="2023-24">Academic Year 2023-24 (Audited)</option>
                <option value="2025-26">Academic Year 2025-26 (Advance Planning)</option>
              </select>
              <p className="text-[11px] text-[#6B7280]">
                Scopes the reporting cycle and default dashboard filters.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-[#374151]">
                Approved Intake Tolerance Threshold ({tolerance}%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value) || 0)}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
                <span className="font-mono font-semibold text-[#111827] tabular-nums w-12 text-right">
                  {tolerance.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                {tolerance === 0
                  ? 'Strict 0% limit: Any admission over approved quota triggers exception.'
                  : `Allows up to +${tolerance}% margin for spot admission adjustments before triggering hard blocking errors.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Validation Thresholds */}
      {activeTab === 'thresholds' && (
        <Card
          title="Validation Rules & Automated Scrutiny Matrix"
          subtitle="Pre-configured deterministic validation rules enforced across batch submissions and individual admissions."
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#111827]">R-INTAKE-01</span>
                  <StatusChip label="Blocking Error" variant="danger" />
                </div>
                <h4 className="font-semibold text-[#111827] mt-1">Intake Ceiling Overrun</h4>
                <p className="text-[11px] text-[#4B5563] mt-0.5">
                  Reported total enrolment exceeds AICTE approved intake ceiling. Flags institution for scrutiny and triggers regulatory exception.
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B7280] shrink-0">Threshold: &gt; 0 excess</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#111827]">R-DUPLICATE-02</span>
                  <StatusChip label="Blocking Error" variant="danger" />
                </div>
                <h4 className="font-semibold text-[#111827] mt-1">Cross-Institution Concurrent Enrolment</h4>
                <p className="text-[11px] text-[#4B5563] mt-0.5">
                  Identical synthetic APAAR identifier found concurrently active in two or more regular full-time programmes.
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B7280] shrink-0">Threshold: Count &gt; 1</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#111827]">R-CORROBORATE-03</span>
                  <StatusChip label="Warning" variant="warning" />
                </div>
                <h4 className="font-semibold text-[#111827] mt-1">Multi-Source Corroboration Gaps</h4>
                <p className="text-[11px] text-[#4B5563] mt-0.5">
                  Record lacks matching APAAR registry seed, Academic Bank of Credits linkage, or State Board corroboration.
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B7280] shrink-0">Threshold: &gt; 1 gap</span>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#111827]">R-TIMELINESS-04</span>
                  <StatusChip label="Review Required" variant="info" />
                </div>
                <h4 className="font-semibold text-[#111827] mt-1">Late Batch Submission & Heavy Revision</h4>
                <p className="text-[11px] text-[#4B5563] mt-0.5">
                  Admissions manifest uploaded after statutory cut-off date or modified heavily following initial deadline.
                </p>
              </div>
              <span className="font-mono text-xs text-[#6B7280] shrink-0">Threshold: &gt; 14 days late</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Risk Weights */}
      {activeTab === 'weights' && (
        <form onSubmit={handleSaveWeights}>
          <Card
            title="Deterministic Risk Indicator Weights"
            subtitle="Configure relative percentage weights for the 5 explainable triage indicators. Must sum to exactly 100%."
            actions={
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    totalWeight === 100 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Total: {totalWeight}%
                </span>
              </div>
            }
          >
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Approved Intake Overrun Weight</span>
                  <span className="font-mono tabular-nums">{weights.intakeOverrun}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights.intakeOverrun}
                  onChange={(e) => setWeights({ ...weights, intakeOverrun: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Cross-Institution Duplicate Enrolment Weight</span>
                  <span className="font-mono tabular-nums">{weights.duplicateEnrolment}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights.duplicateEnrolment}
                  onChange={(e) =>
                    setWeights({ ...weights, duplicateEnrolment: parseInt(e.target.value) || 0 })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Validation Exception Density Weight</span>
                  <span className="font-mono tabular-nums">{weights.exceptionDensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights.exceptionDensity}
                  onChange={(e) =>
                    setWeights({ ...weights, exceptionDensity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Late Submissions & Revision Volume Weight</span>
                  <span className="font-mono tabular-nums">{weights.lateSubmission}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights.lateSubmission}
                  onChange={(e) =>
                    setWeights({ ...weights, lateSubmission: parseInt(e.target.value) || 0 })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Corroboration Gaps (Simulated Adapter) Weight</span>
                  <span className="font-mono tabular-nums">{weights.corroborationGap}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights.corroborationGap}
                  onChange={(e) =>
                    setWeights({ ...weights, corroborationGap: parseInt(e.target.value) || 0 })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              {/* Before & After Simulation Box */}
              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] space-y-2">
                <span className="text-[11px] font-semibold text-[#4B5563] block">
                  Impact Simulation (Before vs. After by Priority Band):
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded bg-rose-50/60 border border-rose-200">
                    <span className="text-rose-800 font-semibold block">High Priority</span>
                    <span className="font-mono tabular-nums text-rose-900">
                      {beforeCounts.high} → <strong>{afterCounts.high}</strong>
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-amber-50/60 border border-amber-200">
                    <span className="text-amber-800 font-semibold block">Moderate</span>
                    <span className="font-mono tabular-nums text-amber-900">
                      {beforeCounts.mod} → <strong>{afterCounts.mod}</strong>
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-50/60 border border-emerald-200">
                    <span className="text-emerald-800 font-semibold block">Low Priority</span>
                    <span className="font-mono tabular-nums text-emerald-900">
                      {beforeCounts.low} → <strong>{afterCounts.low}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {totalWeight !== 100 && (
                    <span className="text-rose-700 text-xs font-medium">
                      Warning: Weights must sum to exactly 100% (currently {totalWeight}%).
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDiscardWeights}
                    className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={totalWeight !== 100}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    Save Weights
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Tab 5: Data & Danger Zone */}
      {activeTab === 'data' && (
        <Card
          title="Data & Storage Management"
          subtitle="Local browser storage configuration and demonstration state controls."
        >
          <div className="space-y-5 text-xs">
            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] space-y-1.5 text-xs text-[#4B5563]">
              <div className="flex items-center gap-2 text-[#111827] font-semibold">
                <Database className="w-4 h-4 text-[#2457D6]" />
                <span>Synthetic Demonstration Storage</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All records, exceptions, institution rosters, and audit trails are persisted locally in your browser&apos;s localStorage under key <code>aervis_state_v1</code>. No external cloud databases or live government registers are mutated.
              </p>
            </div>

            {/* Danger Zone */}
            <div className="p-4 rounded-md border border-rose-200 bg-rose-50/30 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <h4 className="font-semibold text-rose-900 text-xs">Danger Zone: Reset Demo State</h4>
              </div>
              <p className="text-[11px] text-[#4B5563] leading-relaxed">
                Restores the system to its initial baseline: 12 AICTE institutions across 12 distinct Indian states, 160 sample student records, 20 initial validation exceptions, default rule weights, and cleans the audit docket.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setResetDialogOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset All Demo Data to Seed</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        title="Reset All Demo Data?"
        description="This will restore all 12 institutions across 12 states, 160 synthetic student records, 20 initial exceptions, and default rule weights. Any manually added batches or cases will be reset."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleResetData}
        onCancel={() => setResetDialogOpen(false)}
      />
    </div>
  );
};
