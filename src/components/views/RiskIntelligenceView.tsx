import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  HelpCircle,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { Institution, RiskRuleWeights } from '../../types';
import { calculateInstitutionRisk, DEFAULT_RISK_WEIGHTS } from '../../utils/engine';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

export const RiskIntelligenceView: React.FC = () => {
  const {
    institutions,
    records,
    exceptions,
    getInstitutionRisk,
    setInstitutionRiskOverride,
    removeInstitutionRiskOverride,
    settings,
    updateRuleWeights,
    updateTolerance,
  } = useApp();
  const { showToast } = useToast();

  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const [tierFilter, setTierFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all');

  // Reasoned override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Collapsible Scoring rules panel state
  const [isScoringRulesOpen, setIsScoringRulesOpen] = useState(false);
  const [weights, setWeights] = useState<RiskRuleWeights>(settings.ruleWeights);
  const [tolerance, setTolerance] = useState<number>(settings.intakeTolerancePercentage);

  const selectedInst = institutions.find((i) => i.id === selectedInstId) || institutions[0];
  const riskProfile = selectedInst ? getInstitutionRisk(selectedInst.id) : null;

  // Ranked institutions list
  const rankedInstitutions = useMemo(() => {
    return institutions
      .map((i) => ({
        inst: i,
        risk: getInstitutionRisk(i.id),
      }))
      .filter((item) => {
        if (tierFilter === 'all') return true;
        return item.risk.tier === tierFilter;
      })
      .sort((a, b) => b.risk.effectiveScore - a.risk.effectiveScore);
  }, [institutions, getInstitutionRisk, tierFilter]);

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    const scoreNum = parseInt(overrideScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) return;
    if (!overrideReason.trim()) return;

    setInstitutionRiskOverride(selectedInst.id, scoreNum, overrideReason.trim());
    setOverrideModalOpen(false);
    setOverrideReason('');
    showToast(`Recorded override (${scoreNum}/100) for ${selectedInst.name}`, 'warning');
  };

  const handleRemoveOverride = () => {
    if (!selectedInst) return;
    removeInstitutionRiskOverride(selectedInst.id);
    showToast(`Removed manual override for ${selectedInst.name}`, 'info');
  };

  const totalWeight =
    weights.intakeOverrun +
    weights.duplicateEnrolment +
    weights.exceptionDensity +
    weights.lateSubmission +
    weights.corroborationGap;

  const handleSaveScoringRules = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      showToast('Weights must sum to exactly 100%', 'error');
      return;
    }
    updateRuleWeights(weights);
    updateTolerance(tolerance);
    showToast('Saved scoring rules and recalculated risk priorities', 'success');
  };

  const handleResetToDefaultRules = () => {
    setWeights(DEFAULT_RISK_WEIGHTS);
    setTolerance(0);
    updateRuleWeights(DEFAULT_RISK_WEIGHTS);
    updateTolerance(0);
    showToast('Reset scoring rules to default parameters (sum: 100%)', 'neutral');
  };

  // Before & After preview calculation for scoring rules
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

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Risk Intelligence"
        subtitle="Transparent, explainable review-priority engine evaluating intake overruns, cross-institution duplicate collisions, and data variances."
        actions={
          <button
            type="button"
            onClick={() => setIsScoringRulesOpen((prev) => !prev)}
            className="px-3 py-1.5 text-xs font-medium text-[#111827] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2457D6]" />
            <span>Scoring Rules ({isScoringRulesOpen ? 'Hide' : 'Configure'})</span>
            {isScoringRulesOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6B7280]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />}
          </button>
        }
      />

      {/* Collapsible Scoring Rules Panel */}
      {isScoringRulesOpen && (
        <Card
          title="Scoring Rules & Review Calibration"
          description="Adjust risk indicator weights and intake tolerance threshold. Updates recalculate review-priority scores deterministically."
          actions={
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                  totalWeight === 100
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                Weight Sum: {totalWeight}% / 100%
              </span>
            </div>
          }
        >
          <form onSubmit={handleSaveScoringRules} className="space-y-4 text-xs pt-1">
            {/* 5 Indicator Weight Sliders + Tolerance Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Intake Overrun:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.intakeOverrun}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Weight for admissions beyond approved capacity</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.intakeOverrun}
                  onChange={(e) => setWeights({ ...weights, intakeOverrun: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Duplicate Enrolment:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.duplicateEnrolment}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Weight for cross-institution duplicate collisions</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.duplicateEnrolment}
                  onChange={(e) => setWeights({ ...weights, duplicateEnrolment: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Exception Density:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.exceptionDensity}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Weight for ratio of exceptions to total intake</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.exceptionDensity}
                  onChange={(e) => setWeights({ ...weights, exceptionDensity: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Late Submission:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.lateSubmission}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Weight for filing past reporting deadline</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.lateSubmission}
                  onChange={(e) => setWeights({ ...weights, lateSubmission: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Corroboration Gap:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.corroborationGap}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Weight for missing APAAR identity links</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.corroborationGap}
                  onChange={(e) => setWeights({ ...weights, corroborationGap: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[#111827]">Intake Tolerance:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{tolerance}%</span>
                </div>
                <p className="text-[11px] text-[#6B7280] mb-2">Allowable margin before excess seats trigger overrun exceptions</p>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value) || 0)}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>
            </div>

            {/* Impact Simulation Bar & Action Buttons */}
            <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[11px] font-semibold text-[#4B5563]">Priority Impact:</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-medium border border-rose-200">
                    High: {beforeCounts.high} → <strong>{afterCounts.high}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                    Moderate: {beforeCounts.mod} → <strong>{afterCounts.mod}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                    Low: {beforeCounts.low} → <strong>{afterCounts.low}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaultRules}
                  className="px-2.5 py-1 text-xs text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="submit"
                  disabled={totalWeight !== 100}
                  className="px-3.5 py-1 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md disabled:opacity-40 shadow-xs transition-colors cursor-pointer"
                >
                  Save Scoring Rules
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Regulatory Safeguards Callout Box */}
      <div className="p-3.5 bg-[#0B1F3A] text-slate-200 rounded-lg border border-[#1E3A8A] text-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="font-semibold text-white tracking-wide">
            Regulatory Integrity Safeguards & Operational Policy
          </h3>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          The AERVIS score is an operational <strong>review-priority indicator (0–100)</strong>{' '}
          designed strictly to prioritize council examiner scrutiny. It does <strong>not</strong>{' '}
          constitute a finding of fraud or statutory non-compliance. Missing or unverified data must
          never be construed automatically as evidence of misconduct. Authorized reviewers may record
          reasoned manual overrides with complete audit trail provenance.
        </p>
      </div>

      {/* Main Split Grid: Left Priority Matrix / Right Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Ranked Priority Directory (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Institution Priority Ranking"
            subtitle="Ranked deterministically by composite priority score"
            actions={
              <div className="flex items-center gap-1">
                {(['all', 'High', 'Moderate', 'Low'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTierFilter(t)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      tierFilter === t
                        ? 'bg-[#111827] text-white'
                        : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            }
            noPadding
          >
            <div className="divide-y divide-[#F3F4F6] max-h-[560px] overflow-y-auto">
              {rankedInstitutions.map(({ inst, risk }) => {
                const isSelected = inst.id === selectedInstId;
                const excess = inst.reportedEnrolment - inst.approvedIntake;

                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#111827] truncate">
                          {inst.name}
                        </span>
                        {risk.overrideScore !== undefined && (
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {inst.state} · Quota: {inst.approvedIntake} / Reported: {inst.reportedEnrolment}
                        {excess > 0 && (
                          <span className="text-rose-700 font-semibold ml-1">(+{excess})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <div>
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            risk.tier === 'High'
                              ? 'text-rose-700'
                              : risk.tier === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {risk.effectiveScore}/100
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                            risk.tier === 'High'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : risk.tier === 'Moderate'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {risk.tier}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] flex justify-between bg-[#F9FAFB]">
              <span>Formula v1.2 · Deterministic</span>
              <span>Weights sum to 100%</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Explainability Inspector (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            {riskProfile && selectedInst && (
              <div className="space-y-4">
                {/* Institution Header & Score Card */}
                <div className="flex items-start justify-between pb-3.5 border-b border-[#E5E7EB] gap-4">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] font-semibold border border-[#E5E7EB]">
                      CODE: {selectedInst.code}
                    </span>
                    <h3 className="text-base font-bold text-[#111827] mt-1.5">{selectedInst.name}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {selectedInst.state} · {selectedInst.type} · Approved Programmes:{' '}
                      {selectedInst.approvedProgrammesCount}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono text-[#111827] tabular-nums">
                      {riskProfile.effectiveScore}
                      <span className="text-xs font-normal text-[#9CA3AF]">/100</span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-0.5 ${
                        riskProfile.tier === 'High'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : riskProfile.tier === 'Moderate'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {riskProfile.tier} Review Priority
                    </span>
                  </div>
                </div>

                {/* Explainable Narrative Statement */}
                <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                    <HelpCircle className="w-3.5 h-3.5 text-[#2457D6]" />
                    <span>Explainable Triage Rationale</span>
                  </div>
                  <p className="text-[#4B5563] leading-relaxed text-[11px]">
                    {riskProfile.plainExplanation}
                  </p>
                </div>

                {/* Active Override Banner if present */}
                {riskProfile.overrideScore !== undefined && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">
                        Manual Reviewer Override Applied
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveOverride}
                        className="text-[11px] text-amber-800 hover:underline font-medium cursor-pointer"
                      >
                        Reset to Engine Score ({riskProfile.calculatedScore})
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Justification: &quot;{riskProfile.overrideReason}&quot;
                    </p>
                    <p className="text-[10px] text-amber-800 font-mono">
                      Recorded by: {riskProfile.overrideBy} at {riskProfile.overrideTimestamp}
                    </p>
                  </div>
                )}

                {/* 5 Explainable Indicator Bars */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wide">
                    Indicator Contribution Breakdown
                  </h4>
                  <div className="space-y-2.5">
                    {riskProfile.indicators.map((ind) => {
                      const pct = ind.weight > 0 ? (ind.scoreContribution / ind.weight) * 100 : 0;
                      return (
                        <div
                          key={ind.indicatorId}
                          className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#111827]">{ind.name}</span>
                            <span className="font-mono text-xs text-[#374151]">
                              +{ind.scoreContribution} pts{' '}
                              <span className="text-[#9CA3AF]">(wt: {ind.weight}%)</span>
                            </span>
                          </div>

                          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct > 60
                                  ? 'bg-rose-600'
                                  : pct > 30
                                  ? 'bg-amber-500'
                                  : 'bg-[#2457D6]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                            <span>Finding: {ind.rawValue}</span>
                            <span className="truncate max-w-[280px] text-right" title={ind.threshold}>
                              Rule: {ind.threshold}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Action: Reasoned Override Button */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">
                    Need to calibrate priority based on official documentary evidence?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideScore(riskProfile.effectiveScore.toString());
                      setOverrideModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-[#2457D6] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Record Reasoned Override</span>
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Reasoned Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-md w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Record Reasoned Score Override</h3>
            <p className="text-xs text-[#6B7280]">
              Institution: <strong className="text-[#111827]">{selectedInst.name}</strong> (Baseline
              Engine Score: <span className="font-mono">{riskProfile?.calculatedScore}</span>)
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  Adjusted Review Priority Score (0–100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md font-mono focus:outline-none focus:border-[#2457D6]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  Mandatory Audit Justification
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Discrepancy substantiated as state-sanctioned supernumerary quota via CET order #449"
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6] text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs cursor-pointer"
                >
                  Save Override & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
