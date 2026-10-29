import React, { useState, useMemo } from 'react';
import {
  Download,
  Info,
  ChevronDown,
  Building2,
  Users,
  AlertTriangle,
  FolderKanban,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { AcademicYear } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

type ReportType =
  | 'intake_vs_enrolment'
  | 'submission_completeness'
  | 'validation_exceptions'
  | 'duplicate_conflicts'
  | 'risk_indicators'
  | 'case_outcomes';

export const ReportsView: React.FC = () => {
  const { institutions, records, exceptions, auditCases, submissions, getInstitutionRisk, logAudit } =
    useApp();
  const { showToast } = useToast();

  const [activeReport, setActiveReport] = useState<ReportType>('intake_vs_enrolment');
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2024-25');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  const states = useMemo(
    () => Array.from(new Set(institutions.map((i) => i.state))).sort(),
    [institutions]
  );

  // Filtered dataset for reports
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchYear = inst.academicYear === selectedYear;
      const matchState = selectedState === 'all' || inst.state === selectedState;
      const matchInst = selectedInstitution === 'all' || inst.id === selectedInstitution;
      return matchYear && matchState && matchInst;
    });
  }, [institutions, selectedYear, selectedState, selectedInstitution]);

  const filteredInstIds = useMemo(
    () => new Set(filteredInstitutions.map((i) => i.id)),
    [filteredInstitutions]
  );

  const filteredRecords = useMemo(
    () => records.filter((r) => filteredInstIds.has(r.institutionId)),
    [records, filteredInstIds]
  );

  const filteredExceptions = useMemo(
    () => exceptions.filter((e) => filteredInstIds.has(e.institutionId)),
    [exceptions, filteredInstIds]
  );

  const filteredSubmissions = useMemo(
    () => submissions.filter((s) => filteredInstIds.has(s.institutionId)),
    [submissions, filteredInstIds]
  );

  const filteredCases = useMemo(
    () => auditCases.filter((c) => filteredInstIds.has(c.institutionId)),
    [auditCases, filteredInstIds]
  );

  // Dynamic active report metrics calculation (3 large summary numbers)
  const reportMetrics = useMemo(() => {
    switch (activeReport) {
      case 'intake_vs_enrolment': {
        const approved = filteredInstitutions.reduce((acc, i) => acc + i.approvedIntake, 0);
        const reported = filteredInstitutions.reduce((acc, i) => acc + i.reportedEnrolment, 0);
        const excess = filteredInstitutions.reduce((acc, i) => {
          const diff = i.reportedEnrolment - i.approvedIntake;
          return diff > 0 ? acc + diff : acc;
        }, 0);
        return [
          { label: 'Total Approved Intake', value: approved.toLocaleString('en-IN'), note: 'Sanctioned intake capacity' },
          { label: 'Reported Enrolments', value: reported.toLocaleString('en-IN'), note: 'Current active roster submissions' },
          {
            label: 'Capacity Discrepancy Seats',
            value: excess > 0 ? `+${excess}` : '0',
            note: excess > 0 ? 'Exceeding statutory intake limit' : 'All institutions within quota',
            alert: excess > 0,
          },
        ];
      }
      case 'submission_completeness': {
        const totalRows = filteredSubmissions.reduce((acc, s) => acc + s.totalRows, 0);
        const acceptedRows = filteredSubmissions.reduce((acc, s) => acc + s.acceptedCount, 0);
        const reviewRequired = filteredSubmissions.reduce((acc, s) => acc + s.reviewRequiredCount, 0);
        return [
          { label: 'Ingested Submissions', value: filteredSubmissions.length.toString(), note: 'Batch manifests received' },
          { label: 'Validated Records', value: acceptedRows.toLocaleString('en-IN'), note: `Out of ${totalRows.toLocaleString('en-IN')} total rows` },
          {
            label: 'Review Required Rows',
            value: reviewRequired.toString(),
            note: 'Require formatting or identity clarification',
            alert: reviewRequired > 0,
          },
        ];
      }
      case 'validation_exceptions': {
        const blocking = filteredExceptions.filter((e) => e.severity === 'Blocking Error').length;
        const open = filteredExceptions.filter((e) => e.status !== 'Resolved').length;
        return [
          { label: 'Total Exceptions', value: filteredExceptions.length.toString(), note: 'Triggered deterministic validation rules' },
          {
            label: 'Blocking Severity',
            value: blocking.toString(),
            note: 'Immediate verification hold required',
            alert: blocking > 0,
          },
          { label: 'Pending Remediation', value: open.toString(), note: 'Open or escalated inquiries' },
        ];
      }
      case 'duplicate_conflicts': {
        const dupes = filteredRecords.filter((r) => r.validationStatus === 'Duplicate Candidate');
        const affectedInsts = new Set(dupes.map((r) => r.institutionId)).size;
        return [
          { label: 'Duplicate Candidates', value: dupes.length.toString(), note: 'Potential multi-institution enrolments' },
          { label: 'Affected Institutions', value: affectedInsts.toString(), note: 'Colleges with overlapping roster items' },
          { label: 'Simulated Conflict Rate', value: `${((dupes.length / (filteredRecords.length || 1)) * 100).toFixed(1)}%`, note: 'Of evaluated student roster' },
        ];
      }
      case 'risk_indicators': {
        const risks = filteredInstitutions.map((i) => getInstitutionRisk(i.id));
        const highTier = risks.filter((r) => r.tier === 'High').length;
        const avgScore = risks.length ? Math.round(risks.reduce((acc, r) => acc + r.effectiveScore, 0) / risks.length) : 0;
        const overrides = risks.filter((r) => r.overrideScore !== undefined).length;
        return [
          {
            label: 'High Priority Tier',
            value: highTier.toString(),
            note: 'Review score ≥ 65 / 100',
            alert: highTier > 0,
          },
          { label: 'Average Review Score', value: `${avgScore}/100`, note: 'Across selected institutions' },
          { label: 'Manual Overrides', value: overrides.toString(), note: 'Auditor score adjustments with justification' },
        ];
      }
      case 'case_outcomes': {
        const active = filteredCases.filter(
          (c) =>
            c.decisionStatus === 'Open' ||
            c.decisionStatus === 'Awaiting Institution Response' ||
            c.decisionStatus === 'Under Review'
        ).length;
        const escalated = filteredCases.filter((c) => c.decisionStatus === 'Escalated').length;
        return [
          { label: 'Total Inquiries', value: filteredCases.length.toString(), note: 'Audit cases initiated' },
          { label: 'Active Inquiries', value: active.toString(), note: 'Currently under analyst scrutiny' },
          {
            label: 'Escalated Findings',
            value: escalated.toString(),
            note: 'Referred for compliance hearing',
            alert: escalated > 0,
          },
        ];
      }
    }
  }, [
    activeReport,
    filteredInstitutions,
    filteredSubmissions,
    filteredExceptions,
    filteredRecords,
    filteredCases,
    getInstitutionRisk,
  ]);

  // CSV Export Functionality
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let csvData = '';
    const fileName = `aervis_${activeReport}_${selectedYear}.csv`;

    const disclaimerHeader =
      `# AERVIS REGULATORY REPORT EXPORT\n` +
      `# Report Generated: ${timestamp}\n` +
      `# Academic Cycle: ${selectedYear} | State: ${selectedState} | Institution: ${selectedInstitution}\n` +
      `# DISCLAIMER: Synthetic Demonstration Dataset for AICTE Prototype Evaluation. Not an official government record.\n\n`;

    if (activeReport === 'intake_vs_enrolment') {
      csvData =
        disclaimerHeader +
        'InstitutionCode,InstitutionName,State,Type,ApprovedIntake,ReportedEnrolment,DiscrepancySeats,UtilizationPercentage,Status\n';
      filteredInstitutions.forEach((i) => {
        const excess = i.reportedEnrolment - i.approvedIntake;
        const util = ((i.reportedEnrolment / i.approvedIntake) * 100).toFixed(1);
        csvData += `"${i.code}","${i.name}","${i.state}","${i.type}",${i.approvedIntake},${i.reportedEnrolment},${excess},${util}%,"${i.submissionStatus}"\n`;
      });
    } else if (activeReport === 'submission_completeness') {
      csvData =
        disclaimerHeader +
        'ReceiptNumber,InstitutionName,FileName,SubmissionDate,TotalRows,AcceptedRows,ReviewRequired,Status,SubmittedBy\n';
      filteredSubmissions.forEach((s) => {
        csvData += `"${s.receiptNumber}","${s.institutionName}","${s.fileName}","${s.submissionDate}",${s.totalRows},${s.acceptedCount},${s.reviewRequiredCount},"${s.status}","${s.submittedBy}"\n`;
      });
    } else if (activeReport === 'validation_exceptions') {
      csvData =
        disclaimerHeader +
        'ExceptionID,InstitutionName,RuleID,Severity,Reason,AssignedReviewer,Status,Timestamp\n';
      filteredExceptions.forEach((e) => {
        csvData += `"${e.id}","${e.institutionName}","${e.ruleId}","${e.severity}","${e.reason.replace(/"/g, '""')}","${e.assignedReviewer}","${e.status}","${e.detectionTimestamp}"\n`;
      });
    } else if (activeReport === 'duplicate_conflicts') {
      csvData =
        disclaimerHeader +
        'StudentRef,SyntheticAPAAR,InstitutionName,ProgrammeName,EnrolmentStatus,ValidationStatus,ExceptionIndicator\n';
      filteredRecords
        .filter((r) => r.validationStatus === 'Duplicate Candidate')
        .forEach((r) => {
          csvData += `"${r.studentRef}","${r.syntheticApaarId}","${r.institutionName}","${r.programmeName}","${r.enrolmentStatus}","${r.validationStatus}","${(r.exceptionIndicator || '').replace(/"/g, '""')}"\n`;
        });
    } else if (activeReport === 'risk_indicators') {
      csvData =
        disclaimerHeader +
        'InstitutionCode,InstitutionName,EffectiveScore,CalculatedScore,RiskTier,OverrideStatus,TopContributingFactor\n';
      filteredInstitutions.forEach((i) => {
        const risk = getInstitutionRisk(i.id);
        const topFactor = risk.indicators.reduce((prev, curr) =>
          curr.scoreContribution > prev.scoreContribution ? curr : prev
        );
        csvData += `"${i.code}","${i.name}",${risk.effectiveScore},${risk.calculatedScore},"${risk.tier}","${risk.overrideScore !== undefined ? 'Overridden' : 'Standard'}","${topFactor.name} (+${topFactor.scoreContribution}pts)"\n`;
      });
    } else if (activeReport === 'case_outcomes') {
      csvData =
        disclaimerHeader +
        'CaseID,InstitutionName,Priority,DateOpened,DecisionStatus,Reviewer,FindingSummary\n';
      filteredCases.forEach((c) => {
        csvData += `"${c.id}","${c.institutionName}","${c.priority}","${c.dateOpened}","${c.decisionStatus}","${c.assignedReviewer}","${(c.closingReason || c.summary).replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAudit(
      'Report Export',
      activeReport,
      `Exported CSV report with ${filteredInstitutions.length} institutions`,
      'Success'
    );
    showToast(`Exported ${fileName}`, 'success');
  };

  const reportTabs = [
    { id: 'intake_vs_enrolment', label: 'Intake vs. Enrolment', count: filteredInstitutions.length },
    {
      id: 'submission_completeness',
      label: 'Batch Submissions',
      count: filteredSubmissions.length,
    },
    {
      id: 'validation_exceptions',
      label: 'Exceptions Registry',
      count: filteredExceptions.length,
    },
    {
      id: 'duplicate_conflicts',
      label: 'Duplicate Conflicts',
      count: filteredRecords.filter((r) => r.validationStatus === 'Duplicate Candidate').length,
    },
    { id: 'risk_indicators', label: 'Risk Intelligence Ranking', count: filteredInstitutions.length },
    {
      id: 'case_outcomes',
      label: 'Audit Case Outcomes',
      count: filteredCases.length,
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reports & Extracts"
        subtitle="Downloadable regulatory audit extracts, capacity variance registers, and duplicate candidate digests."
        actions={
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Scope Filter Controls */}
      <Card noPadding>
        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Cycle</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:border-[#2457D6]"
            >
              <option value="2024-25">AY 2024-25 (Current Cycle)</option>
              <option value="2023-24">AY 2023-24 (Previous Cycle)</option>
              <option value="2025-26">AY 2025-26 (Provisional)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">State / Jurisdiction</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:border-[#2457D6]"
            >
              <option value="all">All States & Territories ({states.length})</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution Scope</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:border-[#2457D6]"
            >
              <option value="all">All AICTE Institutions ({institutions.length})</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Hero Metric Summary Strip for Selected Report */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportMetrics.map((metric, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-lg border bg-white ${
              metric.alert ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-500">
              {metric.label}
            </div>
            <div
              className={`text-[32px] sm:text-[36px] leading-10 font-bold tabular-nums mt-2 ${
                metric.alert ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {metric.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{metric.note}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={reportTabs}
        activeTab={activeReport}
        onChange={(id) => setActiveReport(id as ReportType)}
      />

      {/* Active Report Table Render */}
      <Card noPadding>
        {activeReport === 'intake_vs_enrolment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3 text-right">Approved Intake</th>
                  <th className="px-4 py-3 text-right">Reported Enrolment</th>
                  <th className="px-4 py-3 text-right">Capacity Variance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No institutions match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredInstitutions.map((i) => {
                    const excess = i.reportedEnrolment - i.approvedIntake;
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-700 font-semibold">
                          {i.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                          <div className="text-xs text-slate-500">{i.type}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{i.state}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">
                          {i.approvedIntake.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {i.reportedEnrolment.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">
                          {excess > 0 ? (
                            <span className="text-rose-700 font-bold">+{excess} excess</span>
                          ) : excess < 0 ? (
                            <span className="text-slate-500">{excess} seats</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">100% compliant</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip
                            label={i.submissionStatus}
                            variant={
                              i.submissionStatus === 'Submitted'
                                ? 'success'
                                : i.submissionStatus === 'Pending Review'
                                ? 'warning'
                                : 'danger'
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'submission_completeness' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3">File Manifest</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3 text-right">Rows</th>
                  <th className="px-4 py-3 text-right">Accepted</th>
                  <th className="px-4 py-3 text-right">Review Req</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No submissions found for the selected scope.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-900 font-semibold">
                        {s.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {s.institutionName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-600">
                        {s.fileName}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-600">
                        {s.submissionDate}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {s.totalRows.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 font-bold">
                        {s.acceptedCount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-700 font-bold">
                        {s.reviewRequiredCount}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={s.status}
                          variant={s.status === 'Validated' ? 'success' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'validation_exceptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Exception ID</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Rule ID</th>
                  <th className="px-4 py-3">Trigger Description</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No validation exceptions identified in this scope.
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-900 font-semibold">
                        {e.id}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {e.institutionName}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityChip severity={e.severity} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-600">
                        {e.ruleId}
                      </td>
                      <td className="px-4 py-3 max-w-sm truncate text-slate-700" title={e.reason}>
                        {e.reason}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={e.status}
                          variant={
                            e.status === 'Resolved'
                              ? 'success'
                              : e.status === 'Escalated'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'duplicate_conflicts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Student Ref</th>
                  <th className="px-4 py-3">Synthetic APAAR ID</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Conflict Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.filter((r) => r.validationStatus === 'Duplicate Candidate').length ===
                0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No duplicate student records detected in this scope.
                    </td>
                  </tr>
                ) : (
                  filteredRecords
                    .filter((r) => r.validationStatus === 'Duplicate Candidate')
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-900 font-semibold">
                          {r.studentRef}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-rose-700 font-bold">
                          {r.syntheticApaarId}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {r.institutionName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.programmeName}</td>
                        <td className="px-4 py-3 text-rose-700 font-medium">
                          {r.exceptionIndicator}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'risk_indicators' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3 text-right">Review Priority Score</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Top Contributing Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstitutions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No institutions match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredInstitutions.map((i) => {
                    const risk = getInstitutionRisk(i.id);
                    const topFactor = risk.indicators.reduce((prev, curr) =>
                      curr.scoreContribution > prev.scoreContribution ? curr : prev
                    );
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-700 font-semibold">
                          {i.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                          <div className="text-xs text-slate-500">{i.state} · {i.type}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900 text-sm">
                          {risk.effectiveScore}/100
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                              risk.tier === 'High'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : risk.tier === 'Moderate'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {risk.tier} Priority
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {topFactor.name}
                          <span className="text-slate-500 ml-1.5 font-mono text-xs font-normal">
                            (+{topFactor.scoreContribution} pts)
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'case_outcomes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3">Case ID</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Decision Status</th>
                  <th className="px-4 py-3">Assigned Reviewer</th>
                  <th className="px-4 py-3">Regulatory Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No audit cases match the selected scope.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-900 font-semibold">
                        {c.id}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        {c.institutionName}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityChip severity={c.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={c.decisionStatus}
                          variant={
                            c.decisionStatus === 'Cleared' || c.decisionStatus === 'Corrected'
                              ? 'success'
                              : c.decisionStatus === 'Escalated'
                              ? 'danger'
                              : 'info'
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.assignedReviewer}</td>
                      <td className="px-4 py-3 max-w-sm truncate text-slate-700">
                        {c.closingReason || c.summary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Collapsible Report Metadata & Methodological Notes */}
      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Info className="w-4 h-4 text-slate-500" />
            <span>About this regulatory extract & methodology</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              showMetadata ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showMetadata && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <h5 className="font-semibold text-slate-900 mb-1">Intake Compliance Calculations</h5>
                <p className="leading-relaxed">
                  Capacity variances are computed as reported active enrolments minus statutory approved
                  intake for the corresponding programme code. Over-quota enrolment triggers automatic
                  validation review.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-slate-900 mb-1">Duplicate Conflict Identification</h5>
                <p className="leading-relaxed">
                  Conflicting records indicate simultaneous active enrolment records linked to an
                  identical synthetic APAAR identifier across separate institutions without documented
                  transfer certs.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-slate-900 mb-1">Explainable Risk Scores</h5>
                <p className="leading-relaxed">
                  Scores (0–100) are computed deterministically using five weighted regulatory risk
                  rules. Tiers are defined as High (≥65), Medium (35–64), and Low (&lt;35).
                </p>
              </div>
            </div>
            <div className="pt-2 text-slate-500 text-xs border-t border-slate-100">
              Disclaimer: All data shown in this export is generated synthetically for AICTE regulatory
              platform evaluation. No real student personal identifiers or confidential institutional records are
              accessed.
            </div>
          </div>
        )}
      </div>

      {/* Regulatory Notice Caption */}
      <div className="text-center text-xs text-slate-400 py-1">
        AERVIS Regulatory Prototype · Synthetic test records for demonstration purposes only.
      </div>
    </div>
  );
};
