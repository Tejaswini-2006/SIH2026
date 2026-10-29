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
  ArrowRight,
  ShieldAlert,
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

  // Active step in 3-step flow:
  // Step 1: Upload (when no file)
  // Step 2: Validate (when file is loaded & validation results exist)
  // Step 3: Confirm / Ingested (when submission committed or processing)
  const currentStep = submissionReceipt ? 3 : parsedRows.length > 0 ? 2 : 1;

  // Sample CSV template generator
  const handleDownloadSampleCsv = () => {
    const csvContent =
      `StudentRef,SyntheticApaarId,StudentName,Gender,Category,ProgrammeCode,AdmissionDate,EnrolmentStatus\n` +
      `STU-2024-801,4821-9920-2101,Aarav S****,M,General,CSE-UG,2024-07-16,Active\n` +
      `STU-2024-802,4821-9920-2102,Diya M****,F,OBC,CSE-UG,2024-07-18,Active\n` +
      `STU-2024-803,4821-9920-2103,Rohan K****,M,SC,ECE-UG,2024-07-20,Active\n` +
      `STU-2024-804,4821-9920-2104,Isha V****,F,General,ECE-UG,2024-07-22,Active\n` +
      `STU-2024-805,4821-9920-2105,Aditya P****,M,EWS,AI-PG,2024-07-25,Active\n` +
      `STU-2024-806,4821-9920-2106,Kavya N****,F,General,AI-PG,2024-07-28,Active\n` +
      `STU-2024-807,4821-9920-2107,Devansh R****,M,OBC,CSE-UG,2024-08-01,Active\n` +
      `STU-2024-808,4821-9920-2108,Sneha B****,F,General,ECE-UG,2024-08-03,Active\n` +
      `STU-2024-809,9823-4102-8819,Priya V****,F,General,CSE-UG,2024-08-05,Active\n` +
      `STU-2024-810,4821-9920-2110,Varun D****,M,General,AERO-UG,2024-08-06,Active\n` +
      `STU-2024-811,,Harsh T****,M,General,AI-PG,2024-08-08,Active\n`;

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
        <span className="font-mono text-xs whitespace-nowrap text-slate-900 font-bold">
          {s.receiptNumber}
        </span>
      ),
    },
    {
      id: 'institutionName',
      header: 'Institution',
      accessor: 'institutionName',
      sortable: true,
      className: 'min-w-[200px]',
      render: (s: Submission) => (
        <span className="text-sm font-semibold text-slate-900 truncate block max-w-xs" title={s.institutionName}>
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
        <span className="font-mono text-xs whitespace-nowrap text-slate-600 truncate block max-w-[180px]" title={s.fileName}>
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
        <span className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
          {s.submissionDate.slice(0, 16)}
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
        <span className="text-xs font-mono text-slate-900 tabular-nums font-bold">
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
        <span className="text-xs font-mono text-emerald-700 tabular-nums font-bold">
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
        <span className="text-xs font-mono text-amber-700 tabular-nums font-bold">
          {s.reviewRequiredCount}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      className: 'w-32',
      render: (s: Submission) => (
        <StatusChip
          label={s.status}
          variant={s.status === 'Validated' ? 'success' : 'warning'}
          size="sm"
        />
      ),
    },
    {
      id: 'submittedBy',
      header: 'Submitted By',
      accessor: 'submittedBy',
      className: 'w-40',
      render: (s: Submission) => (
        <span className="text-xs text-slate-500 truncate block max-w-[150px]" title={s.submittedBy}>
          {s.submittedBy}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Data Submissions"
        subtitle="Ingest and pre-validate institutional student enrolment rosters against approved intake caps."
        actions={
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV template</span>
          </button>
        }
      />

      {/* 3-Step Ingestion Flow Indicator */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className={`p-2.5 rounded-md flex items-center justify-center gap-2 ${
            currentStep === 1
              ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
              : 'text-slate-400 font-normal'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              currentStep === 1 ? 'bg-[#2457D6] text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className={currentStep === 1 ? 'text-sm font-bold text-slate-900' : 'text-xs text-slate-500'}>
              1. Upload Manifest
            </span>
          </div>

          <div className={`p-2.5 rounded-md flex items-center justify-center gap-2 ${
            currentStep === 2
              ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
              : 'text-slate-400 font-normal'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              currentStep === 2 ? 'bg-[#2457D6] text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span className={currentStep === 2 ? 'text-sm font-bold text-slate-900' : 'text-xs text-slate-500'}>
              2. Validate Roster
            </span>
          </div>

          <div className={`p-2.5 rounded-md flex items-center justify-center gap-2 ${
            currentStep === 3
              ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
              : 'text-slate-400 font-normal'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {currentStep === 3 ? '✓' : '3'}
            </span>
            <span className={currentStep === 3 ? 'text-sm font-bold text-slate-900' : 'text-xs text-slate-500'}>
              3. Confirm & Commit
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone & Pre-Ingestion Validation Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form Box (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Upload Admissions Register"
            description="Select institution and upload batch CSV"
          >
            <div className="space-y-4 text-xs">
              {/* Institution Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submitting College
                </label>
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => {
                    setSelectedInstitutionId(e.target.value);
                    setParsedRows([]);
                    setValidationResults([]);
                    setSelectedFile(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#2457D6] text-slate-900 font-medium"
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
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Approved Quota Ceiling:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {selectedInst.approvedIntake} seats
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Current Reported Enrolment:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {selectedInst.reportedEnrolment}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>Available Capacity:</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        selectedInst.approvedIntake >= selectedInst.reportedEnrolment
                          ? 'text-[#2457D6]'
                          : 'text-rose-600'
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
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-[#2457D6] bg-blue-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
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
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-900">
                  {selectedFile ? selectedFile.name : 'Choose CSV or drag & drop'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  11 sample rows with intentional validation checks
                </p>
              </div>

              {selectedFile && (
                <div className="text-xs flex items-center justify-between p-2.5 bg-slate-100 rounded-md border border-slate-200">
                  <div className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-[#2457D6] shrink-0" />
                    <span className="truncate font-mono text-xs text-slate-800">{selectedFile.name}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-600 font-bold shrink-0">
                    {parsedRows.length} rows
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Pre-Ingestion Validation Preview (8 cols) */}
        <div className="lg:col-span-8">
          <Card
            title="Pre-Ingestion Validation Preview"
            description="Automated intake quota, duplicate identifier, and programme mapping checks."
            actions={
              validationResults.length > 0 ? (
                <button
                  type="button"
                  onClick={handleDownloadValidationReport}
                  className="text-xs text-[#2457D6] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export report</span>
                </button>
              ) : undefined
            }
          >
            {parsedRows.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="font-medium text-slate-600">No file selected for validation preview.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a student admission manifest on the left to review automated validation before committing to council records.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3 Large Numbers: Accepted / Review Required / Rejected */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 block">
                      Accepted Rows
                    </span>
                    <p className="text-[32px] leading-9 font-bold font-mono text-emerald-700 tabular-nums mt-1">
                      {acceptedCount}
                    </p>
                    <span className="text-xs text-emerald-600 mt-0.5 block">Passed checks</span>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 block">
                      Review Required
                    </span>
                    <p className="text-[32px] leading-9 font-bold font-mono text-amber-700 tabular-nums mt-1">
                      {reviewRequiredCount}
                    </p>
                    <span className="text-xs text-amber-600 mt-0.5 block">Warnings logged</span>
                  </div>

                  <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-800 block">
                      Rejected Rows
                    </span>
                    <p className="text-[32px] leading-9 font-bold font-mono text-rose-700 tabular-nums mt-1">
                      {rejectedCount}
                    </p>
                    <span className="text-xs text-rose-600 mt-0.5 block">Blocking errors</span>
                  </div>
                </div>

                {/* Row-Level Errors List: Row number in bold, reason in regular text */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-16 font-mono">Row</th>
                        <th className="px-3 py-2">Student Ref</th>
                        <th className="px-3 py-2">Synthetic APAAR</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Findings / Validation Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationResults.map((vr) => (
                        <tr
                          key={vr.rowNumber}
                          className={
                            vr.status === 'Rejected'
                              ? 'bg-rose-50/40'
                              : vr.status === 'Review Required'
                              ? 'bg-amber-50/30'
                              : ''
                          }
                        >
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">
                            #{vr.rowNumber}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-800">
                            {vr.data['StudentRef'] || '—'}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-600">
                            {vr.data['SyntheticApaarId'] || '<missing>'}
                          </td>
                          <td className="px-3 py-2">
                            <StatusChip
                              label={vr.status}
                              variant={
                                vr.status === 'Accepted'
                                  ? 'success'
                                  : vr.status === 'Rejected'
                                  ? 'danger'
                                  : 'warning'
                              }
                              size="sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {vr.errors.length > 0 ? (
                              <div className="space-y-0.5">
                                {vr.errors.map((e, idx) => (
                                  <p key={idx} className="text-xs text-rose-700 font-normal">
                                    {e}
                                  </p>
                                ))}
                              </div>
                            ) : vr.warnings.length > 0 ? (
                              <div className="space-y-0.5">
                                {vr.warnings.map((w, idx) => (
                                  <p key={idx} className="text-xs text-amber-800 font-normal">
                                    {w}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-700 font-normal">
                                Valid admission record
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Commit Button */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {acceptedCount} valid rows will be committed to council state.
                  </span>
                  <button
                    type="button"
                    onClick={handleCommitSubmission}
                    disabled={isProcessing || acceptedCount === 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {isProcessing ? 'Processing...' : 'Ingest valid records'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Submission Receipt Banner */}
      {submissionReceipt && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-start justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-900">
                Batch Successfully Committed
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Receipt Number:{' '}
                <strong className="font-mono text-emerald-950 font-bold">
                  {submissionReceipt.receiptNumber}
                </strong>{' '}
                · {submissionReceipt.acceptedCount} student admissions recorded under{' '}
                {submissionReceipt.institutionName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionReceipt(null)}
            className="text-xs text-emerald-700 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Past Submissions Audit History Table */}
      <Card
        title="Submissions Audit Log"
        description="Historical archive of all uploaded institutional admission files."
      >
        <DataTable
          data={submissions}
          columns={historyColumns}
          keyExtractor={(s) => s.id}
          defaultPageSize={10}
          pageSizeOptions={[10, 20]}
          emptyStateTitle="No previous submissions on record"
          emptyStateDescription="Uploaded batch files will appear here."
        />
      </Card>
    </div>
  );
};
