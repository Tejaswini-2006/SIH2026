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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { Institution, RiskRuleWeights } from '../../types';
import { calculateInstitutionRisk } from '../../utils/engine';
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
  } = useApp();
  const { showToast } = useToast();

  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const [tierFilter, setTierFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all');

  // Reasoned override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Config weights modal
  const [weightsModalOpen, setWeightsModalOpen] = useState(false);
  const [tempWeights, setTempWeights] = useState<RiskRuleWeights>(settings.ruleWeights);

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

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    const sum =
      tempWeights.intakeOverrun +
      tempWeights.duplicateEnrolment +
      tempWeights.exceptionDensity +
      tempWeights.lateSubmission +
      tempWeights.corroborationGap;
    if (sum !== 100) {
      showToast('Weights must sum to exactly 100%', 'error');
      return;
    }
    updateRuleWeights(tempWeights);
    setWeightsModalOpen(false);
    showToast('Rule weights calibrated and risk scores updated', 'success');
  };

  // Before & After preview calculation for weights modal
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
      const simulated = calculateInstitutionRisk(inst, records, exceptions, tempWeights);
      if (simulated.tier === 'High') high++;
      else if (simulated.tier === 'Moderate') mod++;
      else low++;
    });
    return { high, mod, low };
  }, [institutions, records, exceptions, tempWeights]);

  const tempTotalWeight =
    tempWeights.intakeOverrun +
    tempWeights.duplicateEnrolment +
    tempWeights.exceptionDensity +
    tempWeights.lateSubmission +
    tempWeights.corroborationGap;

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Risk Intelligence"
        subtitle="Transparent, explainable review-priority engine evaluating intake overruns, cross-institution duplicate collisions, and data variances."
        actions={
          <button
            type="button"
            onClick={() => {
              setTempWeights(settings.ruleWeights);
              setWeightsModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Calibrate Engine Weights</span>
          </button>
        }
      />

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

      {/* Recalibrate Engine Weights Modal */}
      {weightsModalOpen && (
        <div className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-lg w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Calibrate Risk Engine Rule Weights</h3>
            <p className="text-xs text-[#6B7280]">
              Adjust indicator weight distribution. Modifying weights deterministically updates priority
              scores across all institutions.
            </p>

            <form onSubmit={handleSaveWeights} className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Intake Overrun Weight:</span>
                  <span className="font-mono tabular-nums">{tempWeights.intakeOverrun}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.intakeOverrun}
                  onChange={(e) =>
                    setTempWeights({ ...tempWeights, intakeOverrun: parseInt(e.target.value) || 0 })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Cross-Institution Duplicate Weight:</span>
                  <span className="font-mono tabular-nums">{tempWeights.duplicateEnrolment}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.duplicateEnrolment}
                  onChange={(e) =>
                    setTempWeights({
                      ...tempWeights,
                      duplicateEnrolment: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Exception Density Weight:</span>
                  <span className="font-mono tabular-nums">{tempWeights.exceptionDensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.exceptionDensity}
                  onChange={(e) =>
                    setTempWeights({
                      ...tempWeights,
                      exceptionDensity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Late Submissions Weight:</span>
                  <span className="font-mono tabular-nums">{tempWeights.lateSubmission}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.lateSubmission}
                  onChange={(e) =>
                    setTempWeights({
                      ...tempWeights,
                      lateSubmission: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-[#374151] mb-1">
                  <span>Corroboration Gaps Weight:</span>
                  <span className="font-mono tabular-nums">{tempWeights.corroborationGap}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.corroborationGap}
                  onChange={(e) =>
                    setTempWeights({
                      ...tempWeights,
                      corroborationGap: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full accent-[#2457D6] cursor-pointer"
                />
              </div>

              {/* Before & After Preview of Priority Bands */}
              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] space-y-2">
                <span className="text-[11px] font-semibold text-[#4B5563] block">
                  Impact Simulation (Before vs. After by Priority Band):
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded bg-rose-50/60 border border-rose-200">
                    <span className="text-rose-800 font-semibold block">High</span>
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
                    <span className="text-emerald-800 font-semibold block">Low</span>
                    <span className="font-mono tabular-nums text-emerald-900">
                      {beforeCounts.low} → <strong>{afterCounts.low}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Weights & Validation */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      tempTotalWeight === 100 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    Total: {tempTotalWeight}%
                  </span>
                  {tempTotalWeight !== 100 && (
                    <span className="text-[11px] text-rose-700">Must equal 100%</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWeightsModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tempTotalWeight !== 100}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    Apply Weights
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
