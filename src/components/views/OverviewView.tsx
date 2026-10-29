import React from 'react';
import {
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Copy,
  TrendingUp,
  FolderKanban,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavSection } from '../layout/Sidebar';

interface OverviewViewProps {
  onNavigate: (section: NavSection) => void;
  onSelectInstitution?: (institutionId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onSelectInstitution }) => {
  const { institutions, records, exceptions, auditCases, submissions, auditTrail } = useApp();

  // Metrics
  const totalInstitutions = institutions.length;
  const approvedIntake = institutions.reduce((sum, i) => sum + i.approvedIntake, 0);
  const reportedEnrolment = institutions.reduce((sum, i) => sum + i.reportedEnrolment, 0);
  const acceptedRecords = records.filter((r) => r.validationStatus === 'Valid').length;
  const reviewRequiredRecords = records.filter(
    (r) => r.validationStatus === 'Flagged' || r.validationStatus === 'Duplicate Candidate' || r.enrolmentStatus === 'Pending Review'
  ).length;
  const duplicateConflicts = records.filter((r) => r.validationStatus === 'Duplicate Candidate').length;
  
  // Intake discrepancy count (institutions exceeding approved capacity)
  const intakeDiscrepancyInstitutions = institutions.filter((i) => i.reportedEnrolment > i.approvedIntake);
  const pendingAuditCases = auditCases.filter(
    (c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
  ).length;

  // Priority tiers count
  const highRiskInstitutions = institutions.filter((i) => i.reviewPriorityScore >= 70);
  const moderateRiskInstitutions = institutions.filter((i) => i.reviewPriorityScore >= 40 && i.reviewPriorityScore < 70);
  const lowRiskInstitutions = institutions.filter((i) => i.reviewPriorityScore < 40);

  // Exception distribution
  const blockingExceptions = exceptions.filter((e) => e.severity === 'Blocking Error' && e.status !== 'Dismissed').length;
  const warningExceptions = exceptions.filter((e) => e.severity === 'Warning' && e.status !== 'Dismissed').length;
  const reviewExceptions = exceptions.filter((e) => e.severity === 'Review Required' && e.status !== 'Dismissed').length;
  const infoExceptions = exceptions.filter((e) => e.severity === 'Informational' && e.status !== 'Dismissed').length;

  // Recent 4 submissions
  const recentSubmissions = submissions.slice(0, 4);
  // Recent 5 audit logs
  const recentAudit = auditTrail.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AICTE Enrolment Monitoring & Risk Intelligence</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synthetic monitoring of reported student admissions, approved intake thresholds, and explainable audit risk priority.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <span>Demo Cycle: AY 2024-25</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-600 font-semibold">{totalInstitutions} Sample Institutions</span>
        </div>
      </div>

      {/* 8 Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Institutions in Demo</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">{totalInstitutions}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-medium">100% reporting</span>
            <span>·</span>
            <span>12 states</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved Intake</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums">
            {approvedIntake.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>Reported:</span>
            <span className="font-mono font-medium text-slate-800">{reportedEnrolment.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Accepted Records</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1.5 tabular-nums">
            {acceptedRecords.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>{(records.length > 0 ? (acceptedRecords / records.length) * 100 : 0).toFixed(1)}% verified</span>
            <span>·</span>
            <span>Within quota</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Requiring Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1.5 tabular-nums">
            {reviewRequiredRecords}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 mt-1">
            <span>Pending resolution</span>
            <span>·</span>
            <span>Flagged rows</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Duplicate Candidates</span>
            <Copy className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1.5 tabular-nums">
            {duplicateConflicts}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-800 mt-1">
            <span>Cross-institution</span>
            <span>·</span>
            <span>Shared APAAR</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Intake Discrepancies</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-orange-700 mt-1.5 tabular-nums">
            {intakeDiscrepancyInstitutions.length}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>Colleges over quota</span>
            <span>·</span>
            <span className="font-mono text-orange-700 font-semibold">
              +{intakeDiscrepancyInstitutions.reduce((acc, i) => acc + (i.reportedEnrolment - i.approvedIntake), 0)} seats
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Audit Cases</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1.5 tabular-nums">
            {pendingAuditCases}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>{auditCases.length} total cases</span>
            <span>·</span>
            <span>Inquiry active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">High Review Priority</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1.5 tabular-nums">
            {highRiskInstitutions.length}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>Score &ge; 70</span>
            <span>·</span>
            <span>Triage queue</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Intake vs Enrolment Chart + Exception Severity & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approved Intake vs Reported Enrolment (Bar Visualization) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Approved Intake vs. Reported Enrolment</h3>
                <p className="text-xs text-slate-500">Sample institutions comparison against AICTE approved limits</p>
              </div>
              <button
                onClick={() => onNavigate('institutions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Institution Capacity Bars */}
            <div className="mt-4 space-y-3.5">
              {institutions.slice(0, 6).map((inst) => {
                const maxVal = Math.max(inst.approvedIntake, inst.reportedEnrolment, 460);
                const approvedPct = (inst.approvedIntake / maxVal) * 100;
                const reportedPct = (inst.reportedEnrolment / maxVal) * 100;
                const isOver = inst.reportedEnrolment > inst.approvedIntake;
                const excess = inst.reportedEnrolment - inst.approvedIntake;

                return (
                  <div key={inst.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800 truncate max-w-xs">{inst.name}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-500">Quota: {inst.approvedIntake}</span>
                        <span className={isOver ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                          Reported: {inst.reportedEnrolment}
                        </span>
                        {isOver && (
                          <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                            +{excess} Over
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Multi-track bar */}
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                      {/* Approved Intake track */}
                      <div
                        className="h-full bg-slate-300 rounded-full absolute top-0 left-0"
                        style={{ width: `${approvedPct}%` }}
                        title={`Approved Intake: ${inst.approvedIntake}`}
                      />
                      {/* Reported Enrolment overlay */}
                      <div
                        className={`h-full rounded-full absolute top-0 left-0 ${
                          isOver ? 'bg-rose-500/90' : 'bg-blue-600'
                        }`}
                        style={{ width: `${reportedPct}%` }}
                        title={`Reported Enrolment: ${inst.reportedEnrolment}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                <span>Within Approved Intake</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                <span>Exceeding Intake Threshold</span>
              </div>
            </div>
            <span className="text-[11px] font-mono">Tolerance: 0.0% strict</span>
          </div>
        </div>

        {/* Exception Severity & Review Priority Breakdown */}
        <div className="space-y-4">
          {/* Exceptions by Severity Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Exceptions by Severity</h3>
              <button
                onClick={() => onNavigate('exceptions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Queue
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="text-slate-700">Blocking Errors</span>
                </div>
                <span className="font-mono font-semibold text-rose-700 tabular-nums">{blockingExceptions}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: `${(blockingExceptions / Math.max(1, exceptions.length)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700">Warnings</span>
                </div>
                <span className="font-mono font-semibold text-amber-700 tabular-nums">{warningExceptions}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(warningExceptions / Math.max(1, exceptions.length)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-700">Review Required</span>
                </div>
                <span className="font-mono font-semibold text-blue-700 tabular-nums">{reviewExceptions}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(reviewExceptions / Math.max(1, exceptions.length)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-700">Informational</span>
                </div>
                <span className="font-mono font-semibold text-slate-600 tabular-nums">{infoExceptions}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${(infoExceptions / Math.max(1, exceptions.length)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Institutional Review Priority Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Review Priority Tiers</h3>
                <p className="text-[11px] text-slate-500">Deterministic triage scoring (0-100)</p>
              </div>
              <button
                onClick={() => onNavigate('risk')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Matrix
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200">
                <div className="text-[10px] font-semibold text-rose-800 uppercase tracking-wide">High (70+)</div>
                <div className="text-lg font-bold font-mono text-rose-700 mt-0.5">{highRiskInstitutions.length}</div>
                <div className="text-[10px] text-rose-600">Priority Audit</div>
              </div>
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Moderate (40-69)</div>
                <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">{moderateRiskInstitutions.length}</div>
                <div className="text-[10px] text-amber-600">Sample Check</div>
              </div>
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Low (&lt;40)</div>
                <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{lowRiskInstitutions.length}</div>
                <div className="text-[10px] text-emerald-600">Nominal</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Institutions Requiring Attention + Recent Submissions & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compact List: Institutions Requiring Attention */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Institutions Requiring Immediate Review</h3>
              <p className="text-xs text-slate-500">Sorted by calculated priority score and open violations</p>
            </div>
            <button
              onClick={() => onNavigate('institutions')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {highRiskInstitutions.map((inst) => {
              const excess = inst.reportedEnrolment - inst.approvedIntake;
              return (
                <div key={inst.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">{inst.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                        {inst.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {inst.state} · {inst.type} · Intake: {inst.approvedIntake} / Reported: {inst.reportedEnrolment}{' '}
                      {excess > 0 && <span className="text-rose-600 font-medium">(+{excess} seats)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-rose-700 tabular-nums">
                        {inst.reviewPriorityScore}/100
                      </div>
                      <div className="text-[10px] text-rose-600 font-medium">High Priority</div>
                    </div>
                    <button
                      onClick={() => {
                        if (onSelectInstitution) {
                          onSelectInstitution(inst.id);
                        } else {
                          onNavigate('institutions');
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Submissions & Activity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Data Ingestion Submissions</h3>
                <p className="text-xs text-slate-500">Latest institution upload batches and verification outcome</p>
              </div>
              <button
                onClick={() => onNavigate('submissions')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>Uploads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{sub.institutionName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{sub.fileName}</span>
                      <span>·</span>
                      <span>{sub.submissionDate.slice(0, 16)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                        sub.status === 'Validated'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {sub.acceptedCount}/{sub.totalRows} valid
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Last audit event: {recentAudit[0]?.timestamp || 'None'}</span>
            <button
              onClick={() => onNavigate('audit-trail')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View System Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
