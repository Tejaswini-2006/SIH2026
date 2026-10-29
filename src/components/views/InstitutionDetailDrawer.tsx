import React, { useState } from 'react';
import {
  AlertTriangle,
  FileSpreadsheet,
  FolderKanban,
  ExternalLink,
  ShieldAlert,
  Info,
  HelpCircle,
} from 'lucide-react';
import { Institution } from '../../types';
import { useApp } from '../../context/AppContext';
import { Drawer } from '../ui/Drawer';
import { Tabs } from '../ui/Tabs';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

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
  const {
    exceptions,
    auditCases,
    submissions,
    auditTrail,
    getInstitutionRisk,
    setInstitutionRiskOverride,
    removeInstitutionRiskOverride,
  } = useApp();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'risk' | 'exceptions' | 'submissions' | 'cases' | 'activity'
  >('overview');

  const riskProfile = getInstitutionRisk(institution.id);
  const instExceptions = exceptions.filter((e) => e.institutionId === institution.id);
  const instSubmissions = submissions.filter((s) => s.institutionId === institution.id);
  const instCases = auditCases.filter((c) => c.institutionId === institution.id);
  const instActivity = auditTrail.filter(
    (ev) =>
      ev.affectedRef.includes(institution.code) ||
      ev.affectedRef.includes(institution.id) ||
      ev.details.toLowerCase().includes(institution.name.toLowerCase()) ||
      institution.programmes.some((p) => ev.affectedRef.includes(p.id))
  );

  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideScoreInput, setOverrideScoreInput] = useState(riskProfile.effectiveScore.toString());
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

  const excess = institution.reportedEnrolment - institution.approvedIntake;
  const isOver = excess > 0;

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseInt(overrideScoreInput, 10);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) return;
    if (!overrideReasonInput.trim()) return;

    setInstitutionRiskOverride(institution.id, scoreNum, overrideReasonInput.trim());
    setShowOverrideForm(false);
  };

  const tabs = [
    { id: 'overview', label: 'Programmes', count: institution.programmes.length },
    { id: 'risk', label: 'Risk Indicators' },
    { id: 'exceptions', label: 'Exceptions', count: instExceptions.length },
    { id: 'submissions', label: 'Submissions', count: instSubmissions.length },
    { id: 'cases', label: 'Cases', count: instCases.length },
    { id: 'activity', label: 'Activity', count: instActivity.length },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      width="max-w-[580px]"
      badge={
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#2457D6] font-medium border border-blue-200">
          AICTE CODE: {institution.code}
        </span>
      }
      title={institution.name}
      subtitle={`${institution.state} · ${institution.type} · Registrar: ${institution.contactPerson}`}
      footer={
        <>
          <span className="text-[#6B7280]">Last submission: {institution.lastSubmissionDate}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCase(institution.id)}
              className="px-3 py-1.5 font-medium text-[#111827] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-md transition-colors"
            >
              Open Audit Case
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </>
      }
    >
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-4 border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs divide-x divide-[#E5E7EB]">
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Approved Quota</span>
          <p className="text-sm font-semibold tabular-nums text-[#111827] mt-0.5">{institution.approvedIntake}</p>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Reported</span>
          <p className={`text-sm font-semibold tabular-nums mt-0.5 ${isOver ? 'text-rose-700' : 'text-[#111827]'}`}>
            {institution.reportedEnrolment} {isOver && <span className="text-xs font-normal text-rose-600">(+{excess})</span>}
          </p>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Priority Score</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold tabular-nums text-[#111827]">{riskProfile.effectiveScore}/100</span>
            <SeverityChip severity={riskProfile.tier} size="sm" />
          </div>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Active Issues</span>
          <p className="text-sm font-semibold tabular-nums text-[#111827] mt-0.5">
            {instExceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed').length} Exceptions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-2 bg-white">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />
      </div>

      {/* Tab Panels */}
      <div className="p-5 text-xs">
        {/* Tab 1: Programmes Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#4B5563]">
              <span>Approved programmes vs. reported student registers</span>
              <button
                type="button"
                onClick={() => onNavigateToRecords(institution.name)}
                className="text-[#2457D6] hover:underline font-medium flex items-center gap-1"
              >
                <span>View student records</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">Code</th>
                    <th className="px-3.5 py-2.5">Programme Name</th>
                    <th className="px-3.5 py-2.5 text-right">Quota</th>
                    <th className="px-3.5 py-2.5 text-right">Reported</th>
                    <th className="px-3.5 py-2.5 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                  {institution.programmes.map((p) => {
                    const isProgOver = p.reportedEnrolment > p.approvedIntake;
                    return (
                      <tr key={p.id} className={isProgOver ? 'bg-rose-50/40' : 'hover:bg-[#F9FAFB]'}>
                        <td className="px-3.5 py-2 font-mono text-xs text-[#6B7280]">{p.code}</td>
                        <td className="px-3.5 py-2 font-medium text-[#111827]">
                          <div>{p.name}</div>
                          <div className="text-[10px] text-[#6B7280]">{p.degreeLevel}</div>
                        </td>
                        <td className="px-3.5 py-2 text-right tabular-nums text-[#6B7280]">{p.approvedIntake}</td>
                        <td className="px-3.5 py-2 text-right tabular-nums font-semibold text-[#111827]">
                          {p.reportedEnrolment}
                        </td>
                        <td className="px-3.5 py-2 text-right tabular-nums font-medium">
                          {p.discrepancy > 0 ? (
                            <span className="text-rose-700 font-semibold">+{p.discrepancy} over</span>
                          ) : p.discrepancy < 0 ? (
                            <span className="text-[#9CA3AF]">{p.discrepancy} unfilled</span>
                          ) : (
                            <span className="text-emerald-700">0</span>
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

        {/* Tab 2: Explainable Risk */}
        {activeTab === 'risk' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                <HelpCircle className="w-4 h-4 text-[#2457D6]" />
                <span>Explainable Priority Assessment</span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">{riskProfile.plainExplanation}</p>
              <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
                <strong>Safeguard:</strong> Operational indicator only; does not imply wrongdoing or fraud.
              </div>
            </div>

            {riskProfile.overrideScore !== undefined && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between">
                <div>
                  <span className="font-semibold">Reviewer Override Active:</span> Score set to{' '}
                  <strong className="tabular-nums">{riskProfile.overrideScore}/100</strong> (Calculated: {riskProfile.calculatedScore}/100)
                  <p className="mt-0.5 text-[#4B5563]">"{riskProfile.overrideReason}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeInstitutionRiskOverride(institution.id)}
                  className="text-xs text-amber-800 underline hover:text-amber-950 shrink-0 ml-2"
                >
                  Reset
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              <h4 className="font-semibold text-[#111827]">Contributing Indicators</h4>
              {riskProfile.indicators.map((ind) => (
                <div key={ind.indicatorId} className="p-3 border border-[#E5E7EB] rounded-lg bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#111827]">{ind.name}</span>
                    <div className="flex items-center gap-2">
                      <SeverityChip severity={ind.severity} size="sm" />
                      <span className="font-semibold tabular-nums text-[#111827]">+{ind.scoreContribution} pts</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#4B5563]">{ind.explanation}</p>
                  <div className="flex justify-between text-[11px] text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
                    <span>Observed: {ind.rawValue}</span>
                    <span className="font-mono text-[10px]">Weight: {ind.weight}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Override Trigger */}
            <div className="pt-2">
              {!showOverrideForm ? (
                <button
                  type="button"
                  onClick={() => setShowOverrideForm(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-md transition-colors"
                >
                  Record Reasoned Score Override
                </button>
              ) : (
                <form onSubmit={handleSaveOverride} className="p-3.5 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] space-y-3">
                  <h5 className="font-semibold text-[#111827]">Record Reasoned Override</h5>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#4B5563] mb-1 font-medium">Score (0–100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={overrideScoreInput}
                        onChange={(e) => setOverrideScoreInput(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md font-mono"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] text-[#4B5563] mb-1 font-medium">Justification Reason</label>
                      <input
                        type="text"
                        value={overrideReasonInput}
                        onChange={(e) => setOverrideReasonInput(e.target.value)}
                        placeholder="e.g. Verified supernumerary allocation"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOverrideForm(false)}
                      className="px-2.5 py-1 text-xs text-[#6B7280] hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs text-white bg-[#2457D6] hover:bg-blue-700 rounded-md font-medium"
                    >
                      Save Override
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Exceptions */}
        {activeTab === 'exceptions' && (
          <div className="space-y-3">
            {instExceptions.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No exceptions on record.</div>
            ) : (
              instExceptions.map((ex) => (
                <div key={ex.id} className="p-3 border border-[#E5E7EB] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#111827]">{ex.id}</span>
                      <SeverityChip severity={ex.severity} size="sm" />
                    </div>
                    <span className="text-[11px] text-[#6B7280]">{ex.detectionTimestamp.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs font-medium text-[#111827]">{ex.reason}</p>
                  <p className="text-[11px] text-[#6B7280]">{ex.evidence}</p>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#F3F4F6] text-[#6B7280]">
                    <span>Status: <strong className="text-[#111827]">{ex.status}</strong></span>
                    <span>Reviewer: {ex.assignedReviewer}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Submissions */}
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            {instSubmissions.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No batch submissions recorded.</div>
            ) : (
              instSubmissions.map((sub) => (
                <div key={sub.id} className="p-3 border border-[#E5E7EB] rounded-lg space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-[#111827]">
                    <span className="font-mono">{sub.fileName}</span>
                    <span className="font-mono text-[11px] text-[#6B7280]">{sub.receiptNumber}</span>
                  </div>
                  <div className="flex gap-4 text-[11px] text-[#4B5563] pt-1">
                    <span>Rows: <strong className="tabular-nums font-semibold">{sub.totalRows}</strong></span>
                    <span>Valid: <strong className="tabular-nums font-semibold text-emerald-700">{sub.acceptedCount}</strong></span>
                    <span>Review: <strong className="tabular-nums font-semibold text-amber-700">{sub.reviewRequiredCount}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: Audit Cases */}
        {activeTab === 'cases' && (
          <div className="space-y-3">
            {instCases.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No audit cases on record.</div>
            ) : (
              instCases.map((cs) => (
                <div key={cs.id} className="p-3 border border-[#E5E7EB] rounded-lg space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#111827]">{cs.id}</span>
                      <StatusChip label={cs.decisionStatus} variant="info" size="sm" />
                    </div>
                    <span className="text-[11px] text-[#6B7280]">{cs.dateOpened}</span>
                  </div>
                  <p className="text-[#374151]">{cs.summary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 6: Activity History */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {instActivity.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">No logged activity for this institution.</div>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                {instActivity.map((ev) => (
                  <div key={ev.id} className="relative text-xs">
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#2457D6] ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111827]">{ev.action}</span>
                      <span className="text-[11px] font-mono text-[#6B7280]">{ev.timestamp.slice(0, 16)}</span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] mt-0.5 leading-snug">{ev.details}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B7280]">
                      <span className="font-medium text-[#374151]">{ev.actorRole}</span>
                      <span>·</span>
                      <span className="font-mono">{ev.affectedRef}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};
