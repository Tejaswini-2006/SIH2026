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
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavSection } from '../layout/Sidebar';
import { PageHeader } from '../ui/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { Card } from '../ui/Card';
import { StatusChip } from '../ui/StatusChip';

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
  const totalExcessSeats = intakeDiscrepancyInstitutions.reduce((acc, i) => acc + (i.reportedEnrolment - i.approvedIntake), 0);
  const pendingAuditCases = auditCases.filter(
    (c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
  ).length;

  // Severity breakdown
  const blockingExceptions = exceptions.filter((e) => e.severity === 'Blocking Error' && e.status !== 'Dismissed').length;
  const warningExceptions = exceptions.filter((e) => e.severity === 'Warning' && e.status !== 'Dismissed').length;
  const reviewExceptions = exceptions.filter((e) => e.severity === 'Review Required' && e.status !== 'Dismissed').length;
  const infoExceptions = exceptions.filter((e) => e.severity === 'Informational' && e.status !== 'Dismissed').length;

  // Top 3 attention items
  const attentionItems = [
    {
      id: 'inst-01',
      title: 'Apex Institute of Technology',
      subtitle: '+4 seats over approved intake in B.Tech CSE; candidate STU-008 dual collision',
      badge: 'High Priority',
      badgeVariant: 'danger' as const,
      detailChip: '+4 Over Intake',
      target: 'institution',
    },
    {
      id: 'inst-02',
      title: 'Saraswati College of Engineering',
      subtitle: '+1 seat over intake in B.Tech CSE; cross-institution candidate collision STU-032',
      badge: 'Moderate',
      badgeVariant: 'warning' as const,
      detailChip: 'Duplicate Candidate',
      target: 'institution',
    },
    {
      id: 'EXC-1002',
      title: 'Cross-Institution Collision (STU-008 / STU-023)',
      subtitle: 'Candidate enrolled concurrently at Apex Institute and Saraswati College',
      badge: 'Blocking Error',
      badgeVariant: 'danger' as const,
      detailChip: 'Dual Enrolment',
      target: 'exceptions',
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Executive Overview"
        subtitle="Real-time intake threshold tracking, candidate collision screening, and institutional review triage."
        actions={
          <div className="text-xs text-slate-500 font-medium bg-white border border-[#E5E7EB] px-3.5 py-1.5 rounded-md shadow-2xs">
            <span>Cycle: AY 2024-25</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-slate-900 font-semibold">{totalInstitutions} Institutions (70 Records)</span>
          </div>
        }
      />

      {/* 1. "Needs Attention" Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h2 className="text-lg leading-6 font-semibold text-slate-900">Needs Immediate Scrutiny</h2>
          </div>
          <span className="text-xs text-slate-500">Top 3 prioritize dockets</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] border-l-4 border-l-rose-500 rounded-lg divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.target === 'institution' && onSelectInstitution) {
                  onSelectInstitution(item.id);
                } else if (item.target === 'exceptions') {
                  onNavigate('exceptions');
                }
              }}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm leading-5 font-semibold text-slate-900 group-hover:text-[#2457D6] transition-colors">
                    {item.title}
                  </span>
                  <StatusChip label={item.detailChip} variant="neutral" size="sm" showDot={false} />
                </div>
                <p className="text-xs leading-4 text-slate-500 mt-1 truncate">
                  {item.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                <StatusChip label={item.badge} variant={item.badgeVariant} size="sm" />
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Hero KPI Row (The 4 core action metrics) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-semibold text-slate-900">Key Risk Indicators</h2>
          <span className="text-xs text-slate-500">Real-time validation queue</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Records Requiring Review"
            value={reviewRequiredRecords}
            tone={reviewRequiredRecords > 0 ? 'warning' : 'default'}
            subtext="Flagged or pending verification"
            icon={AlertTriangle}
            onClick={() => onNavigate('records')}
          />

          <KpiCard
            label="Potential Duplicates"
            value={duplicateConflicts}
            tone={duplicateConflicts > 0 ? 'danger' : 'default'}
            subtext="Shared candidate identifiers"
            icon={Copy}
            onClick={() => onNavigate('records')}
          />

          <KpiCard
            label="Intake Discrepancies"
            value={intakeDiscrepancyInstitutions.length}
            tone={intakeDiscrepancyInstitutions.length > 0 ? 'danger' : 'default'}
            subtext={`+${totalExcessSeats} excess seats over quota`}
            icon={TrendingUp}
            onClick={() => onNavigate('institutions')}
          />

          <KpiCard
            label="Active Audit Cases"
            value={pendingAuditCases}
            tone={pendingAuditCases > 0 ? 'info' : 'default'}
            subtext={`${auditCases.length} total council inquiries`}
            icon={FolderKanban}
            onClick={() => onNavigate('cases')}
          />
        </div>

        {/* Secondary KPI Row (Supporting Metrics - Smaller & Quieter) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <KpiCard
            size="secondary"
            label="Total Institutions"
            value={totalInstitutions}
            subtext="5 State jurisdictions"
            icon={Building2}
            onClick={() => onNavigate('institutions')}
          />

          <KpiCard
            size="secondary"
            label="Approved Quota"
            value={approvedIntake}
            subtext="AICTE sanctioned seats"
            icon={Users}
          />

          <KpiCard
            size="secondary"
            label="Reported Enrolment"
            value={reportedEnrolment}
            subtext="Admitted student roster"
            icon={Users}
          />

          <KpiCard
            size="secondary"
            label="Accepted Records"
            value={acceptedRecords}
            subtext={`${((acceptedRecords / Math.max(1, records.length)) * 100).toFixed(0)}% verified compliance`}
            icon={CheckCircle}
            onClick={() => onNavigate('records')}
          />
        </div>
      </section>

      {/* 3. Charts & Analytics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Intake vs Enrolment Chart */}
        <div className="lg:col-span-7">
          <Card
            title="Intake vs. Reported Enrolment"
            description="2 of 6 institutions exceed approved council intake quotas."
            action={
              <button
                type="button"
                onClick={() => onNavigate('institutions')}
                className="text-xs text-[#2457D6] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-4">
              {institutions.map((inst) => {
                const maxScale = 30;
                const approvedPct = (inst.approvedIntake / maxScale) * 100;
                const reportedPct = (inst.reportedEnrolment / maxScale) * 100;
                const excess = inst.reportedEnrolment - inst.approvedIntake;
                const isOver = excess > 0;

                const barColor = isOver
                  ? 'bg-rose-600'
                  : inst.reportedEnrolment === inst.approvedIntake
                  ? 'bg-amber-500'
                  : 'bg-slate-300';

                return (
                  <div key={inst.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 truncate max-w-xs">{inst.name}</span>
                      <div className="flex items-center gap-3 tabular-nums font-medium">
                        <span className="text-slate-500">Approved: {inst.approvedIntake}</span>
                        <span className="text-slate-900 font-semibold">Reported: {inst.reportedEnrolment}</span>
                        {isOver ? (
                          <StatusChip label={`+${excess} over`} variant="danger" size="sm" showDot={false} />
                        ) : (
                          <span className="text-slate-400">Within quota</span>
                        )}
                      </div>
                    </div>

                    {/* Progress track with quota tick mark */}
                    <div className="h-2.5 w-full bg-slate-100 rounded-sm relative overflow-visible">
                      <div
                        className={`h-full rounded-sm ${barColor}`}
                        style={{ width: `${Math.min(100, reportedPct)}%` }}
                      />
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-slate-900 z-10"
                        style={{ left: `${Math.min(100, approvedPct)}%` }}
                        title={`Council Approved Intake: ${inst.approvedIntake}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" />
                  <span>Within quota</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
                  <span>Over approved quota</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 bg-slate-900 inline-block" />
                  <span>Approved intake line</span>
                </div>
              </div>
              <span className="font-mono text-slate-400">AY 2024-25</span>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Exceptions Breakdown & Priority Tiers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Exceptions by Severity */}
          <Card
            title="Validation Exceptions by Severity"
            description="10 active findings prioritized by regulatory urgency."
            action={
              <button
                type="button"
                onClick={() => onNavigate('exceptions')}
                className="text-xs text-[#2457D6] hover:underline font-semibold cursor-pointer"
              >
                Exceptions queue
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="font-semibold text-slate-900">Blocking Error</span>
                  </div>
                  <span className="font-bold text-rose-600 tabular-nums">{blockingExceptions}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full" style={{ width: `${(blockingExceptions / 10) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-900">Warning</span>
                  </div>
                  <span className="font-bold text-amber-600 tabular-nums">{warningExceptions}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(warningExceptions / 10) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2457D6]" />
                    <span className="font-semibold text-slate-900">Review Required</span>
                  </div>
                  <span className="font-bold text-[#2457D6] tabular-nums">{reviewExceptions}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2457D6] rounded-full" style={{ width: `${(reviewExceptions / 10) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="font-medium text-slate-600">Informational</span>
                  </div>
                  <span className="font-semibold text-slate-500 tabular-nums">{infoExceptions}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(infoExceptions / 10) * 100}%` }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Priority Tiers */}
          <Card
            title="Institutional Review Tiers"
            description="Triage distribution based on explainable risk formula."
            action={
              <button
                type="button"
                onClick={() => onNavigate('risk')}
                className="text-xs text-[#2457D6] hover:underline font-semibold cursor-pointer"
              >
                Scoring rules
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                <div className="text-xs font-semibold uppercase text-rose-800 tracking-wider">High (70+)</div>
                <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
                  {institutions.filter((i) => getInstitutionRisk(i.id).tier === 'High').length}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                <div className="text-xs font-semibold uppercase text-amber-800 tracking-wider">Mod (40-69)</div>
                <div className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">
                  {institutions.filter((i) => getInstitutionRisk(i.id).tier === 'Moderate').length}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs font-semibold uppercase text-emerald-800 tracking-wider">Low (&lt;40)</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                  {institutions.filter((i) => getInstitutionRisk(i.id).tier === 'Low').length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Recent Activity Feed (Latest 6 events) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-semibold text-slate-900">Recent Audit Activity</h2>
          <span className="text-xs text-slate-500">Latest 6 events</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {auditTrail.slice(0, 6).map((ev) => {
            const dotColor = {
              Submission: 'bg-[#2457D6]',
              Validation: 'bg-emerald-500',
              Exception: 'bg-rose-500',
              'Case Management': 'bg-amber-500',
              'Risk Override': 'bg-indigo-500',
              'Report Export': 'bg-slate-400',
              Settings: 'bg-slate-400',
              Correction: 'bg-teal-500',
            }[ev.actionCategory] || 'bg-slate-400';

            return (
              <div key={ev.id} className="p-3.5 flex items-start justify-between gap-4 text-xs hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm leading-5 font-semibold text-slate-900 truncate">
                      {ev.action || ev.details}
                    </p>
                    <div className="flex items-center gap-2 text-xs leading-4 text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{ev.actorName || ev.actorRole}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-600">{ev.affectedRef}</span>
                      <span>·</span>
                      <span className="truncate max-w-md">{ev.details}</span>
                    </div>
                  </div>
                </div>

                <span className="text-xs leading-4 text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {ev.timestamp.slice(11, 16)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Safeguard Note */}
      <footer className="text-xs text-slate-400 text-center pb-4">
        AERVIS Prototype · All 70 student records reconcile exactly with reported institutional enrolments across 6 approved colleges.
      </footer>
    </div>
  );
};
