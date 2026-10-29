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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Institution, RiskRuleWeights } from '../../types';

export const RiskIntelligenceView: React.FC = () => {
  const {
    institutions,
    getInstitutionRisk,
    setInstitutionRiskOverride,
    removeInstitutionRiskOverride,
    settings,
    updateRuleWeights,
  } = useApp();

  const [selectedInstId, setSelectedInstId] = useState<string>(institutions[0]?.id || '');
  const [tierFilter, setTierFilter] = useState<'all' | 'High' | 'Moderate' | 'Low'>('all');

  // Reasoned override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Config weights modal / popover
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
  };

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    updateRuleWeights(tempWeights);
    setWeightsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Safeguards Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Risk Intelligence Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent, explainable review-priority engine evaluating intake overruns, cross-institution duplicate collisions, and data variances.
          </p>
        </div>

        <button
          onClick={() => {
            setTempWeights(settings.ruleWeights);
            setWeightsModalOpen(true);
          }}
          className="self-start md:self-auto px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-600" />
          <span>Calibrate Engine Weights</span>
        </button>
      </div>

      {/* Mandatory Regulatory Safeguards Callout Box */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <h3 className="font-semibold text-white tracking-wide">
            Regulatory Integrity Safeguards & Operational Policy
          </h3>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          The AERVIS score is an operational <strong>review-priority indicator (0–100)</strong> designed strictly to prioritize council examiner scrutiny. 
          It does <strong>not</strong> constitute a finding of fraud or statutory non-compliance. Missing or unverified data must never be construed automatically as evidence of misconduct. Authorized reviewers may record reasoned manual overrides with complete audit trail provenance.
        </p>
      </div>

      {/* Main Split Grid: Left Priority Matrix / Right Explainability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Priority Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Institution Priority Ranking</h3>
              <div className="flex items-center gap-1">
                {(['all', 'High', 'Moderate', 'Low'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      tierFilter === t
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 mt-2 max-h-[580px] overflow-y-auto">
              {rankedInstitutions.map(({ inst, risk }) => {
                const isSelected = inst.id === selectedInstId;
                const excess = inst.reportedEnrolment - inst.approvedIntake;

                return (
                  <div
                    key={inst.id}
                    onClick={() => setSelectedInstId(inst.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200'
                        : 'hover:bg-slate-50/80 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">{inst.name}</span>
                        {risk.overrideScore !== undefined && (
                          <span className="text-[9px] font-mono font-medium px-1 bg-amber-100 text-amber-800 rounded">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {inst.state} · Quota: {inst.approvedIntake} / Reported: {inst.reportedEnrolment}
                        {excess > 0 && <span className="text-rose-600 font-semibold ml-1">(+{excess})</span>}
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
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block ${
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
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Deterministic Scoring Formula v1.2</span>
            <span>Weights sum to 100%</span>
          </div>
        </div>

        {/* Right Column: Explainability Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-5">
          {riskProfile && selectedInst && (
            <>
              {/* Institution Header & Score Card */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                    CODE: {selectedInst.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedInst.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedInst.state} · {selectedInst.type} · Approved Programmes: {selectedInst.approvedProgrammesCount}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {riskProfile.effectiveScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded inline-block mt-0.5 ${
                      riskProfile.tier === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : riskProfile.tier === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {riskProfile.tier} Review Priority
                  </span>
                </div>
              </div>

              {/* Explainable Narrative Statement */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Explainable Triage Rationale</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{riskProfile.plainExplanation}</p>
              </div>

              {/* Active Override Banner if present */}
              {riskProfile.overrideScore !== undefined && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Reviewer Override Active:</span> Assigned score is{' '}
                    <strong>{riskProfile.overrideScore}/100</strong> (Computed: {riskProfile.calculatedScore}/100)
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Reason: "{riskProfile.overrideReason}" ({riskProfile.overrideBy})
                    </p>
                  </div>
                  <button
                    onClick={() => removeInstitutionRiskOverride(selectedInst.id)}
                    className="text-xs font-medium text-amber-800 underline hover:text-amber-950"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Contributing Indicators Breakdown Cards */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">Contributing Risk Indicators & Math</h4>
                  <span className="text-[11px] text-slate-400">Deterministic Model Output</span>
                </div>

                <div className="space-y-2.5">
                  {riskProfile.indicators.map((ind) => (
                    <div key={ind.indicatorId} className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{ind.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">Weight: {ind.weight}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              ind.severity === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : ind.severity === 'Elevated'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ind.severity}
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            +{ind.scoreContribution} pts
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">{ind.explanation}</p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                        <span>Observed: {ind.rawValue}</span>
                        <span>Formula: {ind.formula}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer: Reasoned Override Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated baseline: {riskProfile.calculatedScore}/100</span>
                <button
                  onClick={() => {
                    setOverrideScore(riskProfile.effectiveScore.toString());
                    setOverrideModalOpen(true);
                  }}
                  className="px-3 py-1.5 font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Record Reasoned Reviewer Override</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Override Reasoned Modal */}
      {overrideModalOpen && selectedInst && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Reviewer Priority Override</h3>
            <p className="text-xs text-slate-500">
              Apply a documented score modification for <strong>{selectedInst.name}</strong>. An immutable entry will be recorded in the system audit trail.
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Review Priority Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Mandatory Audit Justification</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Discrepancy substantiated as state-sanctioned supernumerary quota via CET order #449"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Calibrate Risk Engine Rule Weights</h3>
            <p className="text-xs text-slate-500">
              Adjust the indicator weight distributions. Modifying weights immediately recalculates priority scores across all institutions deterministically.
            </p>

            <form onSubmit={handleSaveWeights} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Intake Overrun Weight:</span>
                  <span className="font-mono">{tempWeights.intakeOverrun}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.intakeOverrun}
                  onChange={(e) => setTempWeights({ ...tempWeights, intakeOverrun: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Cross-Institution Duplicate Weight:</span>
                  <span className="font-mono">{tempWeights.duplicateEnrolment}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.duplicateEnrolment}
                  onChange={(e) => setTempWeights({ ...tempWeights, duplicateEnrolment: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Exception Density Weight:</span>
                  <span className="font-mono">{tempWeights.exceptionDensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.exceptionDensity}
                  onChange={(e) => setTempWeights({ ...tempWeights, exceptionDensity: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Late Submissions Weight:</span>
                  <span className="font-mono">{tempWeights.lateSubmission}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.lateSubmission}
                  onChange={(e) => setTempWeights({ ...tempWeights, lateSubmission: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Corroboration Gaps Weight:</span>
                  <span className="font-mono">{tempWeights.corroborationGap}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={tempWeights.corroborationGap}
                  onChange={(e) => setTempWeights({ ...tempWeights, corroborationGap: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-mono text-[11px] text-slate-500">
                  Total Weight: {tempWeights.intakeOverrun + tempWeights.duplicateEnrolment + tempWeights.exceptionDensity + tempWeights.lateSubmission + tempWeights.corroborationGap}%
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWeightsModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
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
