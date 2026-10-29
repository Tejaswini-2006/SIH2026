import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart3,
  Users,
  AlertTriangle,
  FolderKanban,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AcademicYear } from '../../types';

type ReportType =
  | 'intake_vs_enrolment'
  | 'submission_completeness'
  | 'validation_exceptions'
  | 'duplicate_conflicts'
  | 'risk_indicators'
  | 'case_outcomes';

export const ReportsView: React.FC = () => {
  const { institutions, records, exceptions, auditCases, submissions, getInstitutionRisk, logAudit } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('intake_vs_enrolment');
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('2024-25');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');

  const states = useMemo(() => Array.from(new Set(institutions.map((i) => i.state))).sort(), [institutions]);

  // Filtered dataset for reports
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const matchYear = inst.academicYear === selectedYear;
      const matchState = selectedState === 'all' || inst.state === selectedState;
      const matchInst = selectedInstitution === 'all' || inst.id === selectedInstitution;
      return matchYear && matchState && matchInst;
    });
  }, [institutions, selectedYear, selectedState, selectedInstitution]);

  const filteredInstIds = useMemo(() => new Set(filteredInstitutions.map((i) => i.id)), [filteredInstitutions]);

  // CSV Export Functionality
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let csvData = '';
    let fileName = `aervis_${activeReport}_${selectedYear}.csv`;

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
        .filter((r) => r.validationStatus === 'Duplicate Candidate' && filteredInstIds.has(r.institutionId))
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

    logAudit('Report Export', activeReport, `Exported CSV report with ${filteredInstitutions.length} institutions`, 'Success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Export Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Statistical Reports & Export Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Downloadable regulatory audit reports, capacity variance registries, and duplicate candidate digests.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="self-start md:self-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Current Report to CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as AcademicYear)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="2024-25">AY 2024-25 (Current)</option>
              <option value="2023-24">AY 2023-24</option>
              <option value="2025-26">AY 2025-26 (Provisional)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">State / Territory</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
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
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Institution Scope</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
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
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-medium text-slate-600 pb-0.5">
        {[
          { id: 'intake_vs_enrolment', label: '1. Intake vs. Enrolment', icon: BarChart3 },
          { id: 'submission_completeness', label: '2. Submission Completeness', icon: FileSpreadsheet },
          { id: 'validation_exceptions', label: '3. Validation Exceptions', icon: AlertTriangle },
          { id: 'duplicate_conflicts', label: '4. Duplicate Conflicts', icon: Copy },
          { id: 'risk_indicators', label: '5. Risk Priority Ranking', icon: Users },
          { id: 'case_outcomes', label: '6. Audit Case Outcomes', icon: FolderKanban },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex items-center gap-2 px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-semibold bg-white'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Report Table Render */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        {/* Report 1: Intake vs Enrolment */}
        {activeReport === 'intake_vs_enrolment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInstitutions.map((i) => {
                  const excess = i.reportedEnrolment - i.approvedIntake;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">{i.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                      <td className="px-4 py-3 text-slate-500">{i.state}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{i.approvedIntake}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {i.reportedEnrolment}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {excess > 0 ? (
                          <span className="text-rose-600 font-bold">+{excess} seats excess</span>
                        ) : excess < 0 ? (
                          <span className="text-slate-400">{excess} seats</span>
                        ) : (
                          <span className="text-emerald-700">100% compliant</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{i.submissionStatus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Submission Completeness */}
        {activeReport === 'submission_completeness' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3 text-right">Rows</th>
                  <th className="px-4 py-3 text-right">Accepted</th>
                  <th className="px-4 py-3 text-right">Review Req</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions
                  .filter((s) => filteredInstIds.has(s.institutionId))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium">{s.receiptNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{s.institutionName}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{s.fileName}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{s.submissionDate}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{s.totalRows}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700">{s.acceptedCount}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-700">{s.reviewRequiredCount}</td>
                      <td className="px-4 py-3">{s.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Validation Exceptions */}
        {activeReport === 'validation_exceptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Rule ID</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exceptions
                  .filter((e) => filteredInstIds.has(e.institutionId))
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium">{e.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{e.institutionName}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700">{e.severity}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{e.ruleId}</td>
                      <td className="px-4 py-3 max-w-sm truncate">{e.reason}</td>
                      <td className="px-4 py-3">{e.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 4: Duplicate Conflicts */}
        {activeReport === 'duplicate_conflicts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Student Ref</th>
                  <th className="px-4 py-3">Synthetic APAAR</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Programme</th>
                  <th className="px-4 py-3">Conflict Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records
                  .filter((r) => r.validationStatus === 'Duplicate Candidate' && filteredInstIds.has(r.institutionId))
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium">{r.studentRef}</td>
                      <td className="px-4 py-3 font-mono text-rose-700 font-bold">{r.syntheticApaarId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.institutionName}</td>
                      <td className="px-4 py-3 text-slate-600">{r.programmeName}</td>
                      <td className="px-4 py-3 text-rose-700">{r.exceptionIndicator}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 5: Risk Indicators */}
        {activeReport === 'risk_indicators' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Institution Name</th>
                  <th className="px-4 py-3 text-right">Review Priority</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Top Contributing Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInstitutions.map((i) => {
                  const risk = getInstitutionRisk(i.id);
                  const topFactor = risk.indicators.reduce((prev, curr) =>
                    curr.scoreContribution > prev.scoreContribution ? curr : prev
                  );
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono">{i.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{i.name}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {risk.effectiveScore}/100
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            risk.tier === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : risk.tier === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {risk.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {topFactor.name} (+{topFactor.scoreContribution} pts)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 6: Case Outcomes */}
        {activeReport === 'case_outcomes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Case ID</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Decision Status</th>
                  <th className="px-4 py-3">Assigned Reviewer</th>
                  <th className="px-4 py-3">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditCases
                  .filter((c) => filteredInstIds.has(c.institutionId))
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium">{c.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{c.institutionName}</td>
                      <td className="px-4 py-3 font-semibold text-rose-700">{c.priority}</td>
                      <td className="px-4 py-3">{c.decisionStatus}</td>
                      <td className="px-4 py-3 text-slate-600">{c.assignedReviewer}</td>
                      <td className="px-4 py-3 max-w-sm truncate text-slate-500">{c.closingReason || c.summary}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
