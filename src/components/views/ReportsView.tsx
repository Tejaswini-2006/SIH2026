import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  BarChart3,
  Users,
  AlertTriangle,
  FolderKanban,
  Copy,
  FileText,
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
      submissions
        .filter((s) => filteredInstIds.has(s.institutionId))
        .forEach((s) => {
          csvData += `"${s.receiptNumber}","${s.institutionName}","${s.fileName}","${s.submissionDate}",${s.totalRows},${s.acceptedCount},${s.reviewRequiredCount},"${s.status}","${s.submittedBy}"\n`;
        });
    } else if (activeReport === 'validation_exceptions') {
      csvData =
        disclaimerHeader +
        'ExceptionID,InstitutionName,RuleID,Severity,Reason,AssignedReviewer,Status,Timestamp\n';
      exceptions
        .filter((e) => filteredInstIds.has(e.institutionId))
        .forEach((e) => {
          csvData += `"${e.id}","${e.institutionName}","${e.ruleId}","${e.severity}","${e.reason.replace(/"/g, '""')}","${e.assignedReviewer}","${e.status}","${e.detectionTimestamp}"\n`;
        });
    } else if (activeReport === 'duplicate_conflicts') {
      csvData =
        disclaimerHeader +
        'StudentRef,SyntheticAPAAR,InstitutionName,ProgrammeName,EnrolmentStatus,ValidationStatus,ExceptionIndicator\n';
      records
        .filter(
          (r) => r.validationStatus === 'Duplicate Candidate' && filteredInstIds.has(r.institutionId)
        )
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
      auditCases
        .filter((c) => filteredInstIds.has(c.institutionId))
        .forEach((c) => {
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
      count: submissions.filter((s) => filteredInstIds.has(s.institutionId)).length,
    },
    {
      id: 'validation_exceptions',
      label: 'Exceptions Registry',
      count: exceptions.filter((e) => filteredInstIds.has(e.institutionId)).length,
    },
    {
      id: 'duplicate_conflicts',
      label: 'Duplicate Conflicts',
      count: records.filter(
        (r) => r.validationStatus === 'Duplicate Candidate' && filteredInstIds.has(r.institutionId)
      ).length,
    },
    { id: 'risk_indicators', label: 'Risk Intelligence Ranking', count: filteredInstitutions.length },
    {
      id: 'case_outcomes',
      label: 'Audit Case Outcomes',
      count: auditCases.filter((c) => filteredInstIds.has(c.institutionId)).length,
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Reports & Extracts"
        subtitle="Downloadable regulatory audit reports, capacity variance registers, and duplicate candidate digests."
        actions={
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Scope Filter Controls */}
      <Card noPadding>
        <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:border-[#2457D6]"
            >
              <option value="2024-25">AY 2024-25 (Current)</option>
              <option value="2023-24">AY 2023-24</option>
              <option value="2025-26">AY 2025-26 (Provisional)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">State / Territory</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:border-[#2457D6]"
            >
              <option value="all">All States ({states.length})</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Institution Scope</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-[#111827] focus:outline-none focus:border-[#2457D6]"
            >
              <option value="all">All Institutions ({institutions.length})</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

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
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Institution Name</th>
                  <th className="px-4 py-2.5">State</th>
                  <th className="px-4 py-2.5 text-right">Approved Intake</th>
                  <th className="px-4 py-2.5 text-right">Reported Enrolment</th>
                  <th className="px-4 py-2.5 text-right">Capacity Variance</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {filteredInstitutions.map((i) => {
                  const excess = i.reportedEnrolment - i.approvedIntake;
                  return (
                    <tr key={i.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827]">
                        {i.code}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{i.name}</td>
                      <td className="px-4 py-2.5 text-[#6B7280]">{i.state}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#4B5563]">
                        {i.approvedIntake}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-[#111827]">
                        {i.reportedEnrolment}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {excess > 0 ? (
                          <span className="text-rose-700 font-semibold">+{excess} excess</span>
                        ) : excess < 0 ? (
                          <span className="text-[#6B7280]">{excess} seats</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">100% compliant</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
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
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'submission_completeness' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Receipt #</th>
                  <th className="px-4 py-2.5">Institution Name</th>
                  <th className="px-4 py-2.5">File Name</th>
                  <th className="px-4 py-2.5">Submission Date</th>
                  <th className="px-4 py-2.5 text-right">Rows</th>
                  <th className="px-4 py-2.5 text-right">Accepted</th>
                  <th className="px-4 py-2.5 text-right">Review Req</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {submissions
                  .filter((s) => filteredInstIds.has(s.institutionId))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
                        {s.receiptNumber}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{s.institutionName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#4B5563]">
                        {s.fileName}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-[#6B7280]">
                        {s.submissionDate}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{s.totalRows}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {s.acceptedCount}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        {s.reviewRequiredCount}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusChip
                          label={s.status}
                          variant={s.status === 'Validated' ? 'success' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'validation_exceptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Institution</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Rule ID</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {exceptions
                  .filter((e) => filteredInstIds.has(e.institutionId))
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
                        {e.id}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{e.institutionName}</td>
                      <td className="px-4 py-2.5">
                        <SeverityChip status={e.severity} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#6B7280]">
                        {e.ruleId}
                      </td>
                      <td className="px-4 py-2.5 max-w-sm truncate text-[#4B5563]" title={e.reason}>
                        {e.reason}
                      </td>
                      <td className="px-4 py-2.5">
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
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'duplicate_conflicts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Student Ref</th>
                  <th className="px-4 py-2.5">Synthetic APAAR</th>
                  <th className="px-4 py-2.5">Institution</th>
                  <th className="px-4 py-2.5">Programme</th>
                  <th className="px-4 py-2.5">Conflict Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {records
                  .filter(
                    (r) =>
                      r.validationStatus === 'Duplicate Candidate' && filteredInstIds.has(r.institutionId)
                  )
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
                        {r.studentRef}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-rose-700 font-semibold">
                        {r.syntheticApaarId}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{r.institutionName}</td>
                      <td className="px-4 py-2.5 text-[#6B7280]">{r.programmeName}</td>
                      <td className="px-4 py-2.5 text-rose-700 font-medium">
                        {r.exceptionIndicator}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'risk_indicators' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Institution Name</th>
                  <th className="px-4 py-2.5 text-right">Review Priority</th>
                  <th className="px-4 py-2.5">Tier</th>
                  <th className="px-4 py-2.5">Top Contributing Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {filteredInstitutions.map((i) => {
                  const risk = getInstitutionRisk(i.id);
                  const topFactor = risk.indicators.reduce((prev, curr) =>
                    curr.scoreContribution > prev.scoreContribution ? curr : prev
                  );
                  return (
                    <tr key={i.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827]">
                        {i.code}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{i.name}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-[#111827]">
                        {risk.effectiveScore}/100
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            risk.tier === 'High'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : risk.tier === 'Moderate'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {risk.tier}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#4B5563]">
                        {topFactor.name}{' '}
                        <span className="font-mono text-[#6B7280]">(+{topFactor.scoreContribution} pts)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'case_outcomes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Case ID</th>
                  <th className="px-4 py-2.5">Institution</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Decision Status</th>
                  <th className="px-4 py-2.5">Assigned Reviewer</th>
                  <th className="px-4 py-2.5">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                {auditCases
                  .filter((c) => filteredInstIds.has(c.institutionId))
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
                        {c.id}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#111827]">{c.institutionName}</td>
                      <td className="px-4 py-2.5">
                        <SeverityChip status={c.priority} />
                      </td>
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5 text-[#6B7280]">{c.assignedReviewer}</td>
                      <td className="px-4 py-2.5 max-w-sm truncate text-[#4B5563]">
                        {c.closingReason || c.summary}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
