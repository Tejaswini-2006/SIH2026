import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { validateCsvRow, RowValidationResult } from '../../utils/engine';
import { Submission } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { DataTable, Column } from '../ui/DataTable';
import { StatusChip } from '../ui/StatusChip';

export const SubmissionsView: React.FC = () => {
  const { institutions, records, submissions, processSubmission, settings } = useApp();
  const { showToast } = useToast();

  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>(
    settings.currentRole === 'Institution Administrator'
      ? settings.activeInstitutionIdForAdmin
      : institutions[0]?.id || ''
  );

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([]);
  const [validationResults, setValidationResults] = useState<RowValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<Submission | null>(null);

  const selectedInst = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0];

  // Sample CSV template generator
  const handleDownloadSampleCsv = () => {
    const csvContent =
      `StudentRef,SyntheticApaarId,StudentName,Gender,Category,ProgrammeCode,AdmissionDate,EnrolmentStatus\n` +
      `STU-2024-801,4821-9920-2101,Aarav S****,Male,General,CSE-UG,2024-07-16,Active\n` +
      `STU-2024-802,4821-9920-2102,Diya M****,Female,OBC,CSE-UG,2024-07-18,Active\n` +
      `STU-2024-803,4821-9920-2103,Rohan K****,Male,SC,ECE-UG,2024-07-20,Active\n` +
      `STU-2024-804,4821-9920-2104,Isha V****,Female,General,ECE-UG,2024-07-22,Active\n` +
      `STU-2024-805,4821-9920-2105,Aditya P****,Male,EWS,AI-PG,2024-07-25,Active\n` +
      `STU-2024-806,4821-9920-2106,Kavya N****,Female,General,AI-PG,2024-07-28,Active\n` +
      `STU-2024-807,4821-9920-2107,Devansh R****,Male,OBC,CSE-UG,2024-08-01,Active\n` +
      `STU-2024-808,4821-9920-2108,Sneha B****,Female,General,ECE-UG,2024-08-03,Active\n` +
      `STU-2024-809,9823-4102-8819,Priya V****,Female,General,CSE-UG,2024-08-05,Active\n` +
      `STU-2024-810,4821-9920-2110,Varun D****,Male,General,AERO-UG,2024-08-06,Active\n` +
      `STU-2024-811,,Harsh T****,Male,General,AI-PG,2024-08-08,Active\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aervis_sample_enrolment_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template (11 rows with intentional checks)', 'info');
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setSubmissionReceipt(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsvText(text);
      setParsedRows(rows);

      if (selectedInst) {
        const results = rows.map((r, idx) => validateCsvRow(r, idx + 1, records, selectedInst));
        setValidationResults(results);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Commit valid submission to state
  const handleCommitSubmission = () => {
    if (!selectedInst || parsedRows.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const { submission } = processSubmission(
          selectedInst.id,
          selectedFile?.name || 'manual_enrolment_upload.csv',
          parsedRows
        );
        setSubmissionReceipt(submission);
        setSelectedFile(null);
        setParsedRows([]);
        setValidationResults([]);
        showToast(`Batch processed: ${submission.receiptNumber}`, 'success');
      } catch (err: any) {
        showToast(err?.message || 'Error processing submission', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  // Download validation report
  const handleDownloadValidationReport = () => {
    if (validationResults.length === 0) return;
    let csv = 'RowNumber,StudentRef,APAAR,Status,Errors,Warnings\n';
    validationResults.forEach((vr) => {
      const ref = vr.data['StudentRef'] || vr.data['student_ref'] || '';
      const apaar = vr.data['SyntheticApaarId'] || vr.data['apaar_id'] || '';
      const errs = `"${vr.errors.join('; ')}"`;
      const warns = `"${vr.warnings.join('; ')}"`;
      csv += `${vr.rowNumber},${ref},${apaar},${vr.status},${errs},${warns}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `validation_report_${selectedFile?.name || 'batch'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported row validation report', 'info');
  };

  const acceptedCount = validationResults.filter((r) => r.status === 'Accepted').length;
  const reviewRequiredCount = validationResults.filter((r) => r.status === 'Review Required').length;
  const rejectedCount = validationResults.filter((r) => r.status === 'Rejected').length;

  // History table columns
  const historyColumns: Column<Submission>[] = [
    {
      id: 'receiptNumber',
      header: 'Receipt Number',
      accessor: 'receiptNumber',
      sortable: true,
      className: 'w-44',
      render: (s: Submission) => (
        <span className="font-mono text-xs whitespace-nowrap text-[#111827] font-semibold">
          {s.receiptNumber}
        </span>
      ),
    },
    {
      id: 'institutionName',
      header: 'Institution Name',
      accessor: 'institutionName',
      sortable: true,
      className: 'min-w-[200px]',
      render: (s: Submission) => (
        <span className="text-xs text-[#111827] font-medium truncate block max-w-xs" title={s.institutionName}>
          {s.institutionName}
        </span>
      ),
    },
    {
      id: 'fileName',
      header: 'File Name',
      accessor: 'fileName',
      className: 'w-48',
      render: (s: Submission) => (
        <span className="font-mono text-xs whitespace-nowrap text-[#4B5563] truncate block max-w-[180px]" title={s.fileName}>
          {s.fileName}
        </span>
      ),
    },
    {
      id: 'submissionDate',
      header: 'Submission Date',
      accessor: 'submissionDate',
      sortable: true,
      className: 'w-36 text-right',
      render: (s: Submission) => (
        <span className="text-xs text-[#4B5563] tabular-nums whitespace-nowrap">
          {s.submissionDate}
        </span>
      ),
    },
    {
      id: 'totalRows',
      header: 'Total Rows',
      accessor: 'totalRows',
      sortable: true,
      className: 'w-24 text-right',
      render: (s: Submission) => (
        <span className="text-xs font-mono text-[#111827] tabular-nums font-medium">
          {s.totalRows}
        </span>
      ),
    },
    {
      id: 'acceptedCount',
      header: 'Accepted',
      accessor: 'acceptedCount',
      sortable: true,
      className: 'w-24 text-right',
      render: (s: Submission) => (
        <span className="text-xs font-mono text-emerald-700 tabular-nums font-semibold">
          {s.acceptedCount}
        </span>
      ),
    },
    {
      id: 'reviewRequiredCount',
      header: 'Review Req',
      accessor: 'reviewRequiredCount',
      sortable: true,
      className: 'w-24 text-right',
      render: (s: Submission) => (
        <span className="text-xs font-mono text-amber-700 tabular-nums font-semibold">
          {s.reviewRequiredCount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-28',
      render: (s: Submission) => (
        <StatusChip
          label={s.status}
          variant={s.status === 'Validated' ? 'success' : 'warning'}
        />
      ),
    },
    {
      id: 'submittedBy',
      header: 'Submitted By',
      accessor: 'submittedBy',
      className: 'w-40',
      render: (s: Submission) => (
        <span className="text-xs text-[#6B7280] truncate block max-w-[150px]" title={s.submittedBy}>
          {s.submittedBy}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Data Submissions"
        subtitle="Ingest and pre-validate institutional student enrolment rosters against approved intake caps and APAAR duplicate rules."
        actions={
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Download CSV Template</span>
          </button>
        }
      />

      {/* Target Institution Selection & Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Upload Form Box */}
        <Card
          title="Upload Admissions Register"
          subtitle="Select institution and upload batch CSV"
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            {/* Institution Selector */}
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Submitting Institution
              </label>
              <select
                value={selectedInstitutionId}
                onChange={(e) => {
                  setSelectedInstitutionId(e.target.value);
                  setParsedRows([]);
                  setValidationResults([]);
                  setSelectedFile(null);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#2457D6] text-[#111827]"
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Institutional Approved Ceiling Overview */}
            {selectedInst && (
              <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-xs space-y-1.5">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Approved Intake Ceiling:</span>
                  <span className="font-mono font-semibold text-[#111827] tabular-nums">
                    {selectedInst.approvedIntake} seats
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Current Reported Enrolment:</span>
                  <span className="font-mono font-semibold text-[#111827] tabular-nums">
                    {selectedInst.reportedEnrolment}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                  <span>Remaining Room:</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      selectedInst.approvedIntake >= selectedInst.reportedEnrolment
                        ? 'text-[#2457D6]'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedInst.approvedIntake >= selectedInst.reportedEnrolment
                      ? `${selectedInst.approvedIntake - selectedInst.reportedEnrolment} seats left`
                      : `+${selectedInst.reportedEnrolment - selectedInst.approvedIntake} overrun`}
                  </span>
                </div>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer ${
                dragActive
                  ? 'border-[#2457D6] bg-blue-50/40'
                  : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-[#F9FAFB]/70'
              }`}
              onClick={() => document.getElementById('csvFileInput')?.click()}
            >
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <UploadCloud className="w-7 h-7 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#111827]">
                {selectedFile ? selectedFile.name : 'Choose CSV file or drag & drop'}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                UTF-8 comma-separated (.csv) with headers
              </p>
            </div>

            {selectedFile && (
              <div className="text-xs text-[#374151] flex items-center justify-between p-2.5 bg-[#F3F4F6] rounded-md border border-[#E5E7EB]">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="w-4 h-4 text-[#2457D6] shrink-0" />
                  <span className="truncate font-mono text-[11px]">{selectedFile.name}</span>
                </div>
                <span className="font-mono text-[11px] text-[#6B7280] shrink-0">
                  {parsedRows.length} rows
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Pre-Ingestion Validation Preview */}
        <Card
          title="Pre-Ingestion Validation Preview"
          subtitle="Row-level format, mandatory identifier, and intake quota checks"
          className="lg:col-span-2 flex flex-col justify-between"
          actions={
            validationResults.length > 0 ? (
              <button
                type="button"
                onClick={handleDownloadValidationReport}
                className="text-xs text-[#2457D6] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            ) : undefined
          }
        >
          {parsedRows.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF] text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#9CA3AF]" />
              <p className="font-medium text-[#4B5563]">No file selected for validation preview.</p>
              <p className="text-[11px] text-[#6B7280] mt-1 max-w-sm mx-auto">
                Upload a student admission CSV on the left to trigger automated checks against approved intake and duplicate collision rules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 3 Summary Badges */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 rounded-md bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-800">Accepted Rows</span>
                  <p className="text-lg font-bold font-mono text-emerald-700 tabular-nums mt-0.5">
                    {acceptedCount}
                  </p>
                  <span className="text-[10px] text-emerald-600">Passed all checks</span>
                </div>
                <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-800">Review Required</span>
                  <p className="text-lg font-bold font-mono text-amber-700 tabular-nums mt-0.5">
                    {reviewRequiredCount}
                  </p>
                  <span className="text-[10px] text-amber-600">Warnings flagged</span>
                </div>
                <div className="p-2.5 rounded-md bg-rose-50/70 border border-rose-200">
                  <span className="text-[11px] font-semibold text-rose-800">Rejected Rows</span>
                  <p className="text-lg font-bold font-mono text-rose-700 tabular-nums mt-0.5">
                    {rejectedCount}
                  </p>
                  <span className="text-[10px] text-rose-600">Blocking errors</span>
                </div>
              </div>

              {/* Validation Rows Table */}
              <div className="border border-[#E5E7EB] rounded-md overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-12 font-mono">Row</th>
                      <th className="px-3 py-2">Student Ref</th>
                      <th className="px-3 py-2">Synthetic APAAR</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Findings / Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] text-[#374151]">
                    {validationResults.map((vr) => (
                      <tr
                        key={vr.rowNumber}
                        className={
                          vr.status === 'Rejected'
                            ? 'bg-rose-50/30'
                            : vr.status === 'Review Required'
                            ? 'bg-amber-50/20'
                            : ''
                        }
                      >
                        <td className="px-3 py-2 font-mono text-[#6B7280]">{vr.rowNumber}</td>
                        <td className="px-3 py-2 font-mono text-[11px] font-medium text-[#111827]">
                          {vr.data['StudentRef'] || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#4B5563]">
                          {vr.data['SyntheticApaarId'] || '<missing>'}
                        </td>
                        <td className="px-3 py-2">
                          <StatusChip
                            label={vr.status}
                            variant={
                              vr.status === 'Accepted'
                                ? 'success'
                                : vr.status === 'Review Required'
                                ? 'warning'
                                : 'danger'
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-[11px]">
                          {vr.errors.length > 0 && (
                            <p className="text-rose-700 font-medium">{vr.errors.join('; ')}</p>
                          )}
                          {vr.warnings.length > 0 && (
                            <p className="text-amber-700">{vr.warnings.join('; ')}</p>
                          )}
                          {vr.errors.length === 0 && vr.warnings.length === 0 && (
                            <span className="text-[#9CA3AF]">Valid record</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">
                  {rejectedCount > 0
                    ? `Notice: ${rejectedCount} row(s) have blocking errors and will generate exceptions upon commit.`
                    : 'Ready to commit batch into application state.'}
                </span>
                <button
                  type="button"
                  onClick={handleCommitSubmission}
                  disabled={isProcessing}
                  className="px-4 py-2 font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Validating Batch...' : 'Commit Batch & Generate Receipt'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Timestamped Receipt Modal/Card if just submitted */}
      {submissionReceipt && (
        <div className="bg-emerald-50/70 border border-emerald-300 rounded-md p-4 text-emerald-950 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-emerald-900">
                Submission Confirmed & Receipt Issued
              </h3>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
              RECEIPT: {submissionReceipt.receiptNumber}
            </span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Batch <strong>{submissionReceipt.fileName}</strong> for{' '}
            <strong>{submissionReceipt.institutionName}</strong> has been successfully processed into
            the active AICTE evaluation dataset. Records have been integrated into Enrolment Records and
            risk metrics updated.
          </p>
          <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-md border border-emerald-200 text-xs">
            <div>
              <span className="text-[11px] text-[#6B7280]">Submission Timestamp</span>
              <p className="font-mono text-xs font-medium text-[#111827] mt-0.5">
                {submissionReceipt.submissionDate}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280]">Total Enrolments Ingested</span>
              <p className="font-mono text-xs font-medium text-[#111827] mt-0.5">
                {submissionReceipt.totalRows}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280]">Accepted Records</span>
              <p className="font-mono text-xs font-bold text-emerald-700 mt-0.5">
                {submissionReceipt.acceptedCount}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-[#6B7280]">Flagged For Review</span>
              <p className="font-mono text-xs font-bold text-amber-700 mt-0.5">
                {submissionReceipt.reviewRequiredCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Submissions Table */}
      <Card
        title="Submission Batch History"
        subtitle="Chronological audit record of institutional batch roster transmissions"
        noPadding
      >
        <DataTable
          data={submissions}
          columns={historyColumns}
          keyExtractor={(s) => s.id}
          defaultSort={{ columnId: 'submissionDate', direction: 'desc' }}
          defaultPageSize={10}
          pageSizeOptions={[10, 20]}
          emptyStateTitle="No submissions recorded"
          emptyStateDescription="Completed batch submissions will be recorded here with official receipts."
          stickyHeader
        />
      </Card>
    </div>
  );
};
