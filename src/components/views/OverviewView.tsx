import React from 'react';
import {
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Copy,
  TrendingUp,
  FolderKanban,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavSection } from '../layout/Sidebar';
import { PageHeader } from '../ui/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { Card } from '../ui/Card';
import { SeverityChip } from '../ui/SeverityChip';
import { StatusChip } from '../ui/StatusChip';
import { Tooltip } from '../ui/Tooltip';

interface OverviewViewProps {
  onNavigate: (section: NavSection) => void;
  onSelectInstitution?: (institutionId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate, onSelectInstitution }) => {
  const { institutions, records, exceptions, auditCases, submissions, auditTrail, getInstitutionRisk } = useApp();

  // Metrics derived dynamically
  const totalInstitutions = institutions.length;
  const approvedIntake = institutions.reduce((sum, i) => sum + i.approvedIntake, 0);
  const reportedEnrolment = institutions.reduce((sum, i) => sum + i.reportedEnrolment, 0);
  const acceptedRecords = records.filter((r) => r.validationStatus === 'Valid').length;
  const reviewRequiredRecords = records.filter(
    (r) => r.validationStatus === 'Flagged' || r.validationStatus === 'Duplicate Candidate' || r.validationStatus === 'Pending'
  ).length;
  const duplicateConflicts = records.filter((r) => r.validationStatus === 'Duplicate Candidate').length;

  const intakeDiscrepancyInstitutions = institutions.filter((i) => i.reportedEnrolment > i.approvedIntake);
  const pendingAuditCases = auditCases.filter(
    (c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
  ).length;

  // Priority tiers
  const highRiskInstitutions = institutions.filter((i) => getInstitutionRisk(i.id).tier === 'High');
  const moderateRiskInstitutions = institutions.filter((i) => getInstitutionRisk(i.id).tier === 'Moderate');
  const lowRiskInstitutions = institutions.filter((i) => getInstitutionRisk(i.id).tier === 'Low');

  // Exceptions by severity (active non-dismissed)
  const blockingExceptions = exceptions.filter((e) => e.severity === 'Blocking Error' && e.status !== 'Dismissed').length;
  const warningExceptions = exceptions.filter((e) => e.severity === 'Warning' && e.status !== 'Dismissed').length;
  const reviewExceptions = exceptions.filter((e) => e.severity === 'Review Required' && e.status !== 'Dismissed').length;
  const infoExceptions = exceptions.filter((e) => e.severity === 'Informational' && e.status !== 'Dismissed').length;

  const uniqueStatesCount = new Set(institutions.map((i) => i.state)).size;
  const recentSubmissions = submissions.slice(0, 4);
  const recentAudit = auditTrail.slice(0, 4);

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Executive Overview"
        description="Synthetic data as of 29 Oct 2026 · Monitoring reported student admissions, approved intake thresholds, and review priority."
        actions={
          <div className="text-xs text-[#6B7280] font-medium bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-md">
            <span>Cycle: AY 2024-25</span>
            <span className="mx-2 text-[#D1D5DB]">|</span>
            <span className="text-[#111827]">{totalInstitutions} Institutions across {uniqueStatesCount} States</span>
          </div>
        }
      />

      {/* 4-Column KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <KpiCard
          label="Approved Intake"
          value={approvedIntake.toLocaleString()}
          subtext={
            <>
              <span>Reported:</span>
              <strong className="text-[#111827] font-semibold">{reportedEnrolment.toLocaleString()}</strong>
            </>
          }
          icon={Users}
        />

        <KpiCard
          label="Accepted Records"
          value={acceptedRecords.toLocaleString()}
          tone="success"
          subtext={
            <span>
              {((acceptedRecords / Math.max(1, records.length)) * 100).toFixed(1)}% verified within quota
            </span>
          }
          icon={CheckCircle}
        />

        <KpiCard
          label="Requiring Review"
          value={reviewRequiredRecords}
          tone={reviewRequiredRecords > 0 ? 'warning' : 'default'}
          subtext={
            <span>Flagged rows or pending validation</span>
          }
          icon={AlertTriangle}
        />

        <KpiCard
          label="Duplicate Conflicts"
          value={duplicateConflicts}
          tone={duplicateConflicts > 0 ? 'danger' : 'default'}
          subtext={
            <span>Cross-institution shared APAAR IDs</span>
          }
          icon={Copy}
        />

        <KpiCard
          label="Intake Discrepancies"
          value={intakeDiscrepancyInstitutions.length}
          tone={intakeDiscrepancyInstitutions.length > 0 ? 'danger' : 'default'}
          subtext={
            <span>
              +{intakeDiscrepancyInstitutions.reduce((acc, i) => acc + (i.reportedEnrolment - i.approvedIntake), 0)} excess seats
            </span>
          }
          icon={TrendingUp}
        />

        <KpiCard
          label="High Priority Triage"
          value={highRiskInstitutions.length}
          tone={highRiskInstitutions.length > 0 ? 'danger' : 'default'}
          subtext={
            <span>Score &ge; 70 audit triage</span>
          }
          icon={ShieldAlert}
        />

        <KpiCard
          label="Active Audit Cases"
          value={pendingAuditCases}
          tone={pendingAuditCases > 0 ? 'info' : 'default'}
          subtext={
            <span>{auditCases.length} total dockets</span>
          }
          icon={FolderKanban}
        />

        <KpiCard
          label="Institutions Sample"
          value={totalInstitutions}
          subtext={
            <span className="text-[#2457D6] font-medium">100% reporting status</span>
          }
          icon={Building2}
        />
      </div>

      {/* Main Grid: Institutions Requiring Attention + Intake vs Enrolment Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Intake vs Enrolment Chart */}
        <div className="lg:col-span-7">
          <Card
            title="Approved Intake vs. Reported Enrolment"
            description="Comparison of reported student admissions against AICTE-sanctioned seats on a standardized scale."
            action={
              <button
                type="button"
                onClick={() => onNavigate('institutions')}
                className="text-xs text-[#2457D6] hover:underline font-medium flex items-center gap-1"
              >
                <span>All Institutions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {institutions.slice(0, 6).map((inst) => {
                const maxScale = 500; // Shared scale across all institutions
                const approvedPct = (inst.approvedIntake / maxScale) * 100;
                const reportedPct = (inst.reportedEnrolment / maxScale) * 100;
                const excess = inst.reportedEnrolment - inst.approvedIntake;
                const isOver = excess > 0;

                // Color rule from item 15:
                // neutral/blue below 100%, amber when exactly 100% or within tolerance, red strictly over quota
                const barColor = isOver
                  ? 'bg-rose-600'
                  : inst.reportedEnrolment === inst.approvedIntake
                  ? 'bg-amber-500'
                  : 'bg-[#2457D6]';

                return (
                  <div key={inst.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1 text-[13px]">
                      <span className="font-medium text-[#111827] truncate max-w-xs">{inst.name}</span>
                      <div className="flex items-center gap-2.5 font-mono text-xs">
                        <span className="text-[#6B7280]">Quota: {inst.approvedIntake}</span>
                        <span className="text-[#111827] font-semibold">Reported: {inst.reportedEnrolment}</span>
                        {isOver ? (
                          <StatusChip label={`+${excess} over`} variant="danger" size="sm" showDot={false} />
                        ) : (
                          <span className="text-[#6B7280] text-[11px]">Within quota</span>
                        )}
                      </div>
                    </div>

                    {/* Multi-track Bar with Quota Tick Marker */}
                    <div className="h-3 w-full bg-[#F3F4F6] rounded relative overflow-visible">
                      {/* Bar Fill */}
                      <div
                        className={`h-full rounded ${barColor}`}
                        style={{ width: `${Math.min(100, reportedPct)}%` }}
                      />

                      {/* Quota Tick Marker Line */}
                      <div
                        className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-slate-900 z-10"
                        style={{ left: `${approvedPct}%` }}
                        title={`Approved Quota: ${inst.approvedIntake}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2457D6]" />
                  <span>Within quota</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <span>Over approved intake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-slate-900 inline-block" />
                  <span>Approved intake marker</span>
                </div>
              </div>
              <span className="text-[11px] font-mono">Shared Scale: 0–500 seats</span>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Institutions Requiring Attention */}
        <div className="lg:col-span-5">
          <Card
            title="Institutions Requiring Attention"
            description="High review priority dockets triaged by capacity overrun and collision density."
            action={
              <button
                type="button"
                onClick={() => onNavigate('institutions')}
                className="text-xs text-[#2457D6] hover:underline font-medium"
              >
                Inspect
              </button>
            }
          >
            <div className="divide-y divide-[#F3F4F6] -my-2">
              {highRiskInstitutions.slice(0, 4).map((inst) => {
                const risk = getInstitutionRisk(inst.id);
                const excess = inst.reportedEnrolment - inst.approvedIntake;

                return (
                  <div
                    key={inst.id}
                    onClick={() => onSelectInstitution?.(inst.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#F9FAFB] cursor-pointer rounded px-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#111827] truncate">{inst.name}</span>
                        <span className="font-mono text-[11px] text-[#6B7280]">{inst.code}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                        {inst.state} · Intake: {inst.approvedIntake} / Reported: {inst.reportedEnrolment}
                        {excess > 0 && <span className="text-rose-700 font-medium ml-1">(+{excess} seats)</span>}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-rose-700 tabular-nums">
                        {risk.effectiveScore}/100
                      </div>
                      <StatusChip label={risk.tier} variant="danger" size="sm" showDot={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Secondary Grid: Severity Breakdown + Priority Tiers + Recent Ingestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exceptions by Severity */}
        <Card
          title="Exceptions by Severity"
          description="Active unresolved findings categorized by regulatory impact."
          action={
            <button
              type="button"
              onClick={() => onNavigate('exceptions')}
              className="text-xs text-[#2457D6] hover:underline font-medium"
            >
              Queue ({exceptions.length})
            </button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span className="text-[#374151]">Blocking Errors</span>
              </div>
              <span className="font-mono font-semibold text-rose-700 tabular-nums">{blockingExceptions}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full"
                style={{ width: `${(blockingExceptions / Math.max(1, exceptions.length)) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[#374151]">Warnings</span>
              </div>
              <span className="font-mono font-semibold text-amber-700 tabular-nums">{warningExceptions}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(warningExceptions / Math.max(1, exceptions.length)) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2457D6]" />
                <span className="text-[#374151]">Review Required</span>
              </div>
              <span className="font-mono font-semibold text-blue-700 tabular-nums">{reviewExceptions}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2457D6] rounded-full"
                style={{ width: `${(reviewExceptions / Math.max(1, exceptions.length)) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[#374151]">Informational</span>
              </div>
              <span className="font-mono font-semibold text-[#6B7280] tabular-nums">{infoExceptions}</span>
            </div>
            <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full"
                style={{ width: `${(infoExceptions / Math.max(1, exceptions.length)) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Priority Tiers */}
        <Card
          title="Review Priority Distribution"
          description="Institutions classified by explainable review-priority engine."
          action={
            <button
              type="button"
              onClick={() => onNavigate('risk')}
              className="text-xs text-[#2457D6] hover:underline font-medium"
            >
              Matrix
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
            <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
              <div className="text-[11px] font-semibold text-rose-800">High (&ge;70)</div>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1 tabular-nums">{highRiskInstitutions.length}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Priority Audit</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
              <div className="text-[11px] font-semibold text-amber-800">Moderate (40–69)</div>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1 tabular-nums">{moderateRiskInstitutions.length}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Sample Check</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <div className="text-[11px] font-semibold text-emerald-800">Low (&lt;40)</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">{lowRiskInstitutions.length}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Nominal</div>
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-4 leading-relaxed">
            Scores triage auditor attention. Elevated priority does not constitute a finding of fraud or misconduct.
          </p>
        </Card>

        {/* Recent Ingestions */}
        <Card
          title="Recent Ingestions"
          description="Latest admission manifests processed into the portal."
          action={
            <button
              type="button"
              onClick={() => onNavigate('submissions')}
              className="text-xs text-[#2457D6] hover:underline font-medium"
            >
              Submissions
            </button>
          }
        >
          <div className="divide-y divide-[#F3F4F6] -my-2 text-xs">
            {recentSubmissions.map((sub) => (
              <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#111827] truncate">{sub.institutionName}</p>
                  <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">{sub.fileName}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                    {sub.acceptedCount}/{sub.totalRows}
                  </span>
                  <p className="text-[10px] text-[#6B7280]">{sub.submissionDate.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sample Record Disclaimer Caption */}
      <div className="text-[11px] text-[#6B7280] text-center pt-2">
        Student-level sample: {records.length} records of {reportedEnrolment.toLocaleString()} reported enrolments (aggregated from institutional batch registers)
      </div>
    </div>
  );
};
