import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Edit3,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { calculateInstitutionRisk, DEFAULT_RISK_WEIGHTS } from '../../utils/engine';
import { RiskRuleWeights, InstitutionRiskProfile } from '../../types';
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
    updateRuleWeights,
    updateTolerance,
    settings,
  } = useApp();
  const { showToast } = useToast();

  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const [tierFilter, setTierFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all');

  // Override modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

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

  // Sorted indicators for the selected institution (highest impact first)
  const sortedIndicators = useMemo(() => {
    if (!riskProfile) return [];
    return [...riskProfile.indicators].sort((a, b) => b.scoreContribution - a.scoreContribution);
  }, [riskProfile]);

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Risk Intelligence"
        subtitle="Transparent review-priority engine evaluating intake overruns, candidate collisions, and data variances."
        actions={
          <button
            type="button"
            onClick={() => setIsScoringRulesOpen((prev) => !prev)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2457D6]" />
            <span>Scoring Rules ({isScoringRulesOpen ? 'Hide' : 'Configure'})</span>
            {isScoringRulesOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        }
      />

      {/* Collapsible Scoring Rules Panel */}
      {isScoringRulesOpen && (
        <Card
          title="Scoring Rule Calibration"
          description="Calibrate indicator weights and tolerance threshold. Total weights must equal 100%."
        >
          <form onSubmit={handleSaveScoringRules} className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
              <div>
                <span className="font-semibold text-slate-900">Composite Weight Sum:</span>{' '}
                <span
                  className={`font-mono font-bold ${
                    totalWeight === 100 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {totalWeight}% / 100%
                </span>
                {totalWeight !== 100 && (
                  <span className="text-rose-600 ml-2 font-medium">
                    (adjust weights by {100 - totalWeight > 0 ? `+${100 - totalWeight}%` : `${100 - totalWeight}%`})
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">Live deterministic recalculation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Intake Overrun:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.intakeOverrun}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Weight for reported admissions exceeding approved intake</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.intakeOverrun}
                  onChange={(e) => setWeights({ ...weights, intakeOverrun: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Duplicate Enrolment:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.duplicateEnrolment}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Weight for cross-institution duplicate collisions</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.duplicateEnrolment}
                  onChange={(e) => setWeights({ ...weights, duplicateEnrolment: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Exception Density:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.exceptionDensity}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Weight for ratio of exceptions to total intake</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.exceptionDensity}
                  onChange={(e) => setWeights({ ...weights, exceptionDensity: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Late Submission:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.lateSubmission}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Weight for filing past reporting deadline</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.lateSubmission}
                  onChange={(e) => setWeights({ ...weights, lateSubmission: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Corroboration Gap:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{weights.corroborationGap}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Weight for missing APAAR identity links</p>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights.corroborationGap}
                  onChange={(e) => setWeights({ ...weights, corroborationGap: parseInt(e.target.value) || 0 })}
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">Intake Tolerance:</span>
                  <span className="font-mono text-xs font-bold text-[#2457D6]">{tolerance}%</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Allowable margin before excess seats trigger overrun</p>
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
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Priority Impact:</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-medium border border-rose-200">
                    High: {beforeCounts.high} → <strong>{afterCounts.high}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                    Mod: {beforeCounts.mod} → <strong>{afterCounts.mod}</strong>
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
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-300 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Default</span>
                </button>
                <button
                  type="submit"
                  disabled={totalWeight !== 100}
                  className="px-3.5 py-1 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Save Scoring Rules
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Main Split Grid: Left Priority Matrix / Right Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Priority Directory (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Institution Priority Ranking"
            description="Ranked deterministically by composite priority score"
            actions={
              <div className="flex items-center gap-1">
                {(['all', 'High', 'Moderate', 'Low'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTierFilter(t)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      tierFilter === t
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            }
            noPadding
          >
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {rankedInstitutions.map(({ inst, risk }) => {
                const isSelected = inst.id === selectedInstId;
                const excess = inst.reportedEnrolment - inst.approvedIntake;

                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-[3px] border-l-[#2457D6]'
                        : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {inst.name}
                        </span>
                        {risk.overrideScore !== undefined && (
                          <span className="text-xs font-mono font-medium px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {inst.state} · Quota: {inst.approvedIntake} / Reported: {inst.reportedEnrolment}
                        {excess > 0 && (
                          <span className="text-rose-600 font-semibold ml-1">(+{excess})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <div>
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            risk.tier === 'High'
                              ? 'text-rose-600'
                              : risk.tier === 'Moderate'
                              ? 'text-amber-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {risk.effectiveScore}/100
                        </div>
                        <StatusChip
                          label={risk.tier}
                          variant={risk.tier === 'High' ? 'danger' : risk.tier === 'Moderate' ? 'warning' : 'neutral'}
                          size="sm"
                          showDot={false}
                        />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Explainability Inspector (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            {riskProfile && selectedInst && (
              <div className="space-y-5">
                {/* 1. Large 40px Score with Low/Moderate/High Chip at Top */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-4">
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      CODE: {selectedInst.code}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 mt-2">{selectedInst.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedInst.state} · {selectedInst.type} · Approved Programmes: {selectedInst.approvedProgrammesCount}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[40px] leading-none font-bold font-mono text-slate-900 tabular-nums">
                      {riskProfile.effectiveScore}
                      <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                    <div className="mt-1.5 flex justify-end">
                      <StatusChip
                        label={`${riskProfile.tier} Review Priority`}
                        variant={
                          riskProfile.tier === 'High'
                            ? 'danger'
                            : riskProfile.tier === 'Moderate'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Plain-Language Explanation in a clearly separated card (14px/22px) */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-[#2457D6]" />
                    <span>Explainable Triage Rationale</span>
                  </div>
                  <p className="text-sm leading-[22px] text-slate-700">
                    {riskProfile.plainExplanation}
                  </p>
                </div>

                {/* Active Override Banner if present */}
                {riskProfile.overrideScore !== undefined && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">
                        Manual Reviewer Override Applied
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveOverride}
                        className="text-xs text-amber-800 hover:underline font-semibold cursor-pointer"
                      >
                        Reset to Engine Score ({riskProfile.calculatedScore})
                      </button>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Justification: &quot;{riskProfile.overrideReason}&quot;
                    </p>
                    <p className="text-xs text-amber-800 font-mono">
                      Recorded by: {riskProfile.overrideBy} at {riskProfile.overrideTimestamp}
                    </p>
                  </div>
                )}

                {/* 3. Contributing Indicators Sorted by Impact (Top Contributor Emphasized) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Contributing Indicators (Sorted by Impact)
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">Top contributor highlighted</span>
                  </div>

                  <div className="space-y-2.5">
                    {sortedIndicators.map((ind, idx) => {
                      const isTop = idx === 0 && ind.scoreContribution > 0;
                      const pct = ind.weight > 0 ? (ind.scoreContribution / ind.weight) * 100 : 0;
                      return (
                        <div
                          key={ind.indicatorId}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                            isTop
                              ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold ${isTop ? 'text-slate-900 text-sm' : 'text-slate-800'}`}>
                              {ind.name} {isTop && <span className="text-xs font-semibold text-[#2457D6] ml-1.5">(Primary Factor)</span>}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">
                              +{ind.scoreContribution} pts{' '}
                              <span className="text-slate-400 font-normal">(wt: {ind.weight}%)</span>
                            </span>
                          </div>

                          <div className={`w-full h-2 rounded-full overflow-hidden ${isTop ? 'bg-blue-100' : 'bg-slate-200'}`}>
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

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Finding: <strong className="text-slate-700">{ind.rawValue}</strong></span>
                            <span className="truncate max-w-[280px] text-right" title={ind.threshold}>
                              Threshold: {ind.threshold}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Action: Reasoned Override Button */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Need to calibrate priority based on official documentary evidence?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideScore(riskProfile.effectiveScore.toString());
                      setOverrideModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-[#2457D6] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* 4. One-Line Safeguard Caption */}
      <footer className="text-xs text-slate-400 text-center pb-2">
        AERVIS review-priority score (0–100) triages council scrutiny. It is an operational indicator and does not constitute a finding of fraud or misconduct.
      </footer>

      {/* Reasoned Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-slate-900 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Record Reasoned Score Override</h3>
            <p className="text-xs text-slate-500">
              Institution: <strong className="text-slate-900">{selectedInst.name}</strong> (Baseline
              Engine Score: <span className="font-mono">{riskProfile?.calculatedScore}</span>)
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Adjusted Review Priority Score (0–100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md font-mono focus:outline-none focus:border-[#2457D6]"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Mandatory Audit Justification
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Discrepancy substantiated as state-sanctioned supernumerary quota via CET order #449"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#2457D6] text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs cursor-pointer"
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
