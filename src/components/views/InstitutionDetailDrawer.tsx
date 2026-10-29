import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  FileSpreadsheet,
  FolderKanban,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  History,
} from 'lucide-react';
import { Institution, AuditCase } from '../../types';
import { useApp } from '../../context/AppContext';

interface InstitutionDetailDrawerProps {
  institution: Institution;
  onClose: () => void;
  onOpenCase: (institutionId: string) => void;
  onNavigateToRecords: (institutionName: string) => void;
}

export const InstitutionDetailDrawer: React.FC<InstitutionDetailDrawerProps> = ({
  institution,
  onClose,
  onOpenCase,
  onNavigateToRecords,
}) => {
  const { exceptions, auditCases, submissions, getInstitutionRisk, setInstitutionRiskOverride, removeInstitutionRiskOverride, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'programmes' | 'risk' | 'exceptions' | 'submissions' | 'cases'>('programmes');

  // Risk profile with explainability
  const riskProfile = getInstitutionRisk(institution.id);
  const instExceptions = exceptions.filter((e) => e.institutionId === institution.id);
  const instSubmissions = submissions.filter((s) => s.institutionId === institution.id);
  const instCases = auditCases.filter((c) => c.institutionId === institution.id);

  // Override score state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideScoreInput, setOverrideScoreInput] = useState(riskProfile.effectiveScore.toString());
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

  const excess = institution.reportedEnrolment - institution.approvedIntake;

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseInt(overrideScoreInput, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) return;
    if (!overrideReasonInput.trim()) return;

    setInstitutionRiskOverride(institution.id, scoreNum, overrideReasonInput.trim());
    setShowOverrideForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                AICTE CODE: {institution.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">AY {institution.academicYear}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 truncate">{institution.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {institution.state} · {institution.type} · Registrar: {institution.contactPerson} ({institution.contactEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-white text-xs divide-x divide-slate-100">
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Approved Intake</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{institution.approvedIntake}</p>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Reported Enrolment</span>
            <p className={`text-base font-bold font-mono mt-0.5 ${excess > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {institution.reportedEnrolment}{' '}
              {excess > 0 && <span className="text-xs font-semibold text-rose-600">(+{excess})</span>}
            </p>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Review Priority</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-base font-bold font-mono ${
                  riskProfile.tier === 'High'
                    ? 'text-rose-700'
                    : riskProfile.tier === 'Moderate'
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {riskProfile.effectiveScore}/100
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                  riskProfile.tier === 'High'
                    ? 'bg-rose-100 text-rose-800'
                    : riskProfile.tier === 'Moderate'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {riskProfile.tier}
              </span>
            </div>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Active Issues</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {instExceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed').length} Exceptions
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 gap-6 text-xs font-medium text-slate-500 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('programmes')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'programmes'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Programme Breakdown ({institution.programmes.length})
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'risk'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Risk Indicators & Formula ({riskProfile.indicators.length})
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'exceptions'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Exceptions ({instExceptions.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'submissions'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Submissions ({instSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'cases'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Audit Cases ({instCases.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. Programme-level Breakdown */}
          {activeTab === 'programmes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Detailed comparison between approved AICTE council intake and reported admission registers.
                </p>
                <button
                  onClick={() => onNavigateToRecords(institution.name)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <span>Filter Student Records</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Code</th>
                      <th className="px-3.5 py-2.5">Programme Name</th>
                      <th className="px-3.5 py-2.5">Level</th>
                      <th className="px-3.5 py-2.5 text-right">Approved Intake</th>
                      <th className="px-3.5 py-2.5 text-right">Reported Enrolment</th>
                      <th className="px-3.5 py-2.5 text-right">Discrepancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {institution.programmes.map((p) => {
                      const isProgOver = p.reportedEnrolment > p.approvedIntake;
                      return (
                        <tr key={p.id} className={isProgOver ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600">{p.code}</td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-900">{p.name}</td>
                          <td className="px-3.5 py-2.5 text-slate-500">{p.degreeLevel}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">{p.approvedIntake}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">
                            {p.reportedEnrolment}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono tabular-nums">
                            {p.discrepancy > 0 ? (
                              <span className="text-rose-600 font-semibold">+{p.discrepancy} seats</span>
                            ) : p.discrepancy < 0 ? (
                              <span className="text-slate-400">{p.discrepancy} unfilled</span>
                            ) : (
                              <span className="text-emerald-600">0 (Nominal)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Explainable Risk Indicators */}
          {activeTab === 'risk' && (
            <div className="space-y-5">
              {/* Plain-Language Narrative Callout */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Explainable Triage Summary</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{riskProfile.plainExplanation}</p>
                    <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-200/80 pt-2">
                      <strong>Safeguard Notice:</strong> Review priority scores are operational indicators designed to route council auditor attention. Missing documentation or elevated intake does not constitute a finding of fraud or misconduct.
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoned Override Notice if active */}
              {riskProfile.overrideScore !== undefined && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold">Reviewer Override Active:</span> Assigned score modified to{' '}
                    <span className="font-mono font-bold">{riskProfile.overrideScore}/100</span> (Calculated:{' '}
                    {riskProfile.calculatedScore}/100).
                    <p className="text-amber-800 mt-1">Justification: "{riskProfile.overrideReason}"</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      Recorded by {riskProfile.overrideBy} on {riskProfile.overrideTimestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => removeInstitutionRiskOverride(institution.id)}
                    className="text-xs text-amber-700 underline hover:text-amber-900 shrink-0"
                  >
                    Clear Override
                  </button>
                </div>
              )}

              {/* Indicator Breakdown Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-900">Contributing Indicator Breakdown</h4>
                {riskProfile.indicators.map((ind) => (
                  <div key={ind.indicatorId} className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
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
                        <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                          +{ind.scoreContribution} pts
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{ind.explanation}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      <span>Observed: {ind.rawValue}</span>
                      <span>Formula: {ind.formula}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reviewer Override Action */}
              <div className="pt-2">
                {!showOverrideForm ? (
                  <button
                    onClick={() => setShowOverrideForm(true)}
                    className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
                  >
                    Record Reasoned Score Override
                  </button>
                ) : (
                  <form onSubmit={handleSaveOverride} className="p-4 border border-slate-300 rounded-lg bg-slate-50 space-y-3 text-xs">
                    <h5 className="font-semibold text-slate-900">Record Reviewer Priority Override</h5>
                    <p className="text-slate-500">
                      Authorized reviewers may modify the effective review score with mandatory documented justification recorded to the system audit trail.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">New Score (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={overrideScoreInput}
                          onChange={(e) => setOverrideScoreInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-700 font-medium mb-1">Audit Justification Reason</label>
                        <input
                          type="text"
                          value={overrideReasonInput}
                          onChange={(e) => setOverrideReasonInput(e.target.value)}
                          placeholder="e.g. Approved under state CET supernumerary quota order #884"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowOverrideForm(false)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                      >
                        Save Override & Log Audit
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 3. Exceptions */}
          {activeTab === 'exceptions' && (
            <div className="space-y-3">
              {instExceptions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No validation exceptions recorded for this institution.
                </div>
              ) : (
                instExceptions.map((ex) => (
                  <div key={ex.id} className="p-3.5 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900">{ex.id}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            ex.severity === 'Blocking Error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : ex.severity === 'Warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {ex.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{ex.ruleId}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{ex.detectionTimestamp}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{ex.reason}</p>
                    <p className="text-slate-500 text-[11px]">{ex.evidence}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-100">
                      <span>Status: <strong className="text-slate-700">{ex.status}</strong></span>
                      <span>Reviewer: {ex.assignedReviewer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. Submissions */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {instSubmissions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No batch upload submissions on record.
                </div>
              ) : (
                instSubmissions.map((sub) => (
                  <div key={sub.id} className="p-3.5 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-semibold text-slate-900">{sub.fileName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{sub.receiptNumber}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-slate-600 text-[11px] pt-1">
                      <div>Total Rows: <strong className="font-mono text-slate-800">{sub.totalRows}</strong></div>
                      <div>Accepted: <strong className="font-mono text-emerald-700">{sub.acceptedCount}</strong></div>
                      <div>Review Req: <strong className="font-mono text-amber-700">{sub.reviewRequiredCount}</strong></div>
                      <div>Status: <strong className="text-slate-800">{sub.status}</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. Cases */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Regulatory inquiries and review audit files.</p>
                <button
                  onClick={() => onOpenCase(institution.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Open New Audit Case</span>
                </button>
              </div>

              {instCases.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No active or closed audit cases logged for this institution.
                </div>
              ) : (
                instCases.map((cs) => (
                  <div key={cs.id} className="p-3.5 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-blue-600" />
                        <span className="font-mono font-bold text-slate-900">{cs.id}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {cs.decisionStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{cs.dateOpened}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{cs.summary}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      <span>Priority: <strong className="text-rose-700">{cs.priority}</strong></span>
                      <span>Reviewer: {cs.assignedReviewer}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">Last updated: {institution.lastSubmissionDate}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCase(institution.id)}
              className="px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            >
              Open Audit Case
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
