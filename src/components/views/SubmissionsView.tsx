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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateCsvRow, RowValidationResult } from '../../utils/engine';
import { Submission } from '../../types';

export const SubmissionsView: React.FC = () => {
  const { institutions, records, submissions, processSubmission, settings } = useApp();

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

  // Completed Receipt state
  const [submissionReceipt, setSubmissionReceipt] = useState<Submission | null>(null);

  const selectedInst = institutions.find((i) => i.id === selectedInstitutionId) || institutions[0];

  // Sample CSV template content generator
  const handleDownloadSampleCsv = () => {
    const csvContent =
      `StudentRef,SyntheticApaarId,StudentName,Gender,Category,ProgrammeCode,AdmissionDate,EnrolmentStatus\n` +
      `STU-2024-9101,DEMO-APAAR-4102-8812,A*** S***,M,General,CSE-UG,2024-08-16,Active\n` +
      `STU-2024-9102,DEMO-APAAR-4102-8813,P*** M***,F,OBC,CSE-UG,2024-08-17,Active\n` +
      `STU-2024-9103,DEMO-APAAR-8832-4411,K*** R***,M,General,ECE-UG,2024-08-19,Active\n` +
      `STU-2024-9104,DEMO-APAAR-4102-8815,S*** D***,F,EWS,MECH-UG,2024-08-20,Active\n` +
      `STU-2024-9105,DEMO-APAAR-4102-8816,V*** N***,M,SC,MBA-PG,2024-08-21,Active\n` +
      `STU-2024-9106,,R*** T***,F,General,CSE-UG,2024-08-22,Active\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aervis_sample_enrolment_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV text parsing helper
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

      // Run dry-run row validation
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
      } catch (err: any) {
        alert(err?.message || 'Error processing submission');
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
  };

  const acceptedCount = validationResults.filter((r) => r.status === 'Accepted').length;
  const reviewRequiredCount = validationResults.filter((r) => r.status === 'Review Required').length;
  const rejectedCount = validationResults.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Template Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Submissions & Ingestion Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload institutional student-level admission registers for batch validation against approved intake and APAAR cross-enrolment rules.
          </p>
        </div>

        <button
          onClick={handleDownloadSampleCsv}
          className="self-start md:self-auto px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Target Institution Selection & Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Box */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Upload Admissions Batch</h3>

          {/* Institution Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Submitting Institution</label>
            <select
              value={selectedInstitutionId}
              onChange={(e) => {
                setSelectedInstitutionId(e.target.value);
                setParsedRows([]);
                setValidationResults([]);
                setSelectedFile(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
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
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Sanctioned Council Intake:</span>
                <strong className="font-mono text-slate-900">{selectedInst.approvedIntake}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Current Reported:</span>
                <strong className="font-mono text-slate-900">{selectedInst.reportedEnrolment}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Remaining Quota:</span>
                <strong className="font-mono text-blue-700">
                  {Math.max(0, selectedInst.approvedIntake - selectedInst.reportedEnrolment)} seats
                </strong>
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
              dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
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
            <p className="text-xs font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Choose CSV file or drag & drop'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">UTF-8 comma-delimited (.csv) with headers</p>
          </div>

          {selectedFile && (
            <div className="text-xs text-slate-600 flex items-center justify-between p-2.5 bg-slate-100 rounded border border-slate-200">
              <div className="flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate font-mono">{selectedFile.name}</span>
              </div>
              <span className="font-mono text-slate-500 shrink-0">{parsedRows.length} rows</span>
            </div>
          )}
        </div>

        {/* Validation Preview & Submission Confirmation */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pre-Ingestion Validation Preview</h3>
                <p className="text-xs text-slate-500">Row-level format, mandatory field, and intake checks</p>
              </div>

              {validationResults.length > 0 && (
                <button
                  onClick={handleDownloadValidationReport}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              )}
            </div>

            {/* If no file loaded yet */}
            {parsedRows.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>No file selected for validation preview.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload a student admission CSV to run automated local checks against approved intake and duplicate rules.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* 3 Summary Badges */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-800">Accepted Rows</span>
                    <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">{acceptedCount}</p>
                    <span className="text-[10px] text-emerald-600">Passed all checks</span>
                  </div>
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200">
                    <span className="text-[11px] font-semibold text-amber-800">Review Required</span>
                    <p className="text-lg font-bold font-mono text-amber-700 mt-0.5">{reviewRequiredCount}</p>
                    <span className="text-[10px] text-amber-600">Warnings flagged</span>
                  </div>
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200">
                    <span className="text-[11px] font-semibold text-rose-800">Rejected Rows</span>
                    <p className="text-lg font-bold font-mono text-rose-700 mt-0.5">{rejectedCount}</p>
                    <span className="text-[10px] text-rose-600">Blocking errors</span>
                  </div>
                </div>

                {/* Validation Rows Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-12">Row</th>
                        <th className="px-3 py-2">Student Ref</th>
                        <th className="px-3 py-2">Synthetic APAAR</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Findings / Reasons</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationResults.map((vr) => (
                        <tr key={vr.rowNumber} className={vr.status === 'Rejected' ? 'bg-rose-50/40' : vr.status === 'Review Required' ? 'bg-amber-50/30' : ''}>
                          <td className="px-3 py-2 font-mono text-slate-500">{vr.rowNumber}</td>
                          <td className="px-3 py-2 font-mono">{vr.data['StudentRef'] || '—'}</td>
                          <td className="px-3 py-2 font-mono text-[11px]">{vr.data['SyntheticApaarId'] || '<missing>'}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                vr.status === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : vr.status === 'Review Required'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {vr.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            {vr.errors.length > 0 && (
                              <p className="text-rose-700 font-medium">{vr.errors.join('; ')}</p>
                            )}
                            {vr.warnings.length > 0 && (
                              <p className="text-amber-700">{vr.warnings.join('; ')}</p>
                            )}
                            {vr.errors.length === 0 && vr.warnings.length === 0 && (
                              <span className="text-slate-400">Valid record</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Submission Action */}
          {parsedRows.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {rejectedCount > 0
                  ? `Warning: ${rejectedCount} row(s) have blocking errors and will generate exceptions.`
                  : 'Ready to commit batch into application state.'}
              </span>
              <button
                onClick={handleCommitSubmission}
                disabled={isProcessing}
                className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isProcessing ? 'Validating Batch...' : 'Commit Batch & Generate Receipt'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timestamped Receipt Modal/Card if just submitted */}
      {submissionReceipt && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 text-emerald-950 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">Submission Confirmed & Receipt Issued</h3>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
              RECEIPT: {submissionReceipt.receiptNumber}
            </span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Batch <strong>{submissionReceipt.fileName}</strong> for <strong>{submissionReceipt.institutionName}</strong> has been successfully processed into the active AICTE evaluation dataset. Records have been integrated into Enrolment Records and risk metrics updated.
          </p>
          <div className="grid grid-cols-4 gap-3 bg-white/70 p-3 rounded border border-emerald-200 text-xs">
            <div>
              <span className="text-[11px] text-slate-500">Submission Timestamp</span>
              <p className="font-mono font-medium text-slate-800 mt-0.5">{submissionReceipt.submissionDate}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Total Enrolments Ingested</span>
              <p className="font-mono font-medium text-slate-800 mt-0.5">{submissionReceipt.totalRows}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Accepted Records</span>
              <p className="font-mono font-bold text-emerald-700 mt-0.5">{submissionReceipt.acceptedCount}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Flagged For Review</span>
              <p className="font-mono font-bold text-amber-700 mt-0.5">{submissionReceipt.reviewRequiredCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Submission Batch History</h3>
            <p className="text-xs text-slate-500">Audit trail of completed batch data submissions</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{submissions.length} completed batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
              <tr>
                <th className="px-4 py-3">Receipt Number</th>
                <th className="px-4 py-3">Institution Name</th>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3 text-right">Rows</th>
                <th className="px-4 py-3 text-right">Accepted</th>
                <th className="px-4 py-3 text-right">Review Req</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">{sub.receiptNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs">{sub.institutionName}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{sub.fileName}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{sub.submissionDate}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{sub.totalRows}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    {sub.acceptedCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-700 font-medium">
                    {sub.reviewRequiredCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded font-medium inline-block ${
                        sub.status === 'Validated'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{sub.submittedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
