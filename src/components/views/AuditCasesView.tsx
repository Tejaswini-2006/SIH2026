import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  PlusCircle,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Building2,
  ChevronRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { AuditCase, CaseDecisionStatus, CasePriority } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';
import { Tabs } from '../ui/Tabs';

export const AuditCasesView: React.FC = () => {
  const {
    auditCases,
    institutions,
    createAuditCase,
    updateAuditCaseStatus,
    addCaseResponse,
    requestCaseClarification,
    settings,
  } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(auditCases[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'evidence' | 'responses' | 'timeline'>('evidence');

  // Modals / Form States
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [targetInstId, setTargetInstId] = useState(institutions[0]?.id || '');
  const [newPriority, setNewPriority] = useState<CasePriority>('High');
  const [newSummary, setNewSummary] = useState('');

  // Interactive In-Case Actions
  const [showClarificationForm, setShowClarificationForm] = useState(false);
  const [clarificationNoticeText, setClarificationNoticeText] = useState('');

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [institutionReplyText, setInstitutionReplyText] = useState('');
  const [institutionResponder, setInstitutionResponder] = useState('Registrar / Examination Controller');

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [targetDecisionStatus, setTargetDecisionStatus] = useState<CaseDecisionStatus>('Cleared');
  const [decisionReason, setDecisionReason] = useState('');

  // Priority sort order
  const priorityRank: Record<CasePriority, number> = {
    Urgent: 1,
    High: 2,
    Normal: 3,
    Low: 4,
  };

  const filteredCases = useMemo(() => {
    return auditCases
      .filter((c) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          c.id.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q);

        const matchesStatus =
          selectedStatus === 'all'
            ? true
            : selectedStatus === 'active'
            ? c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
            : c.decisionStatus === selectedStatus;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by priority, then by dateOpened descending
        const pDiff = (priorityRank[a.priority] || 5) - (priorityRank[b.priority] || 5);
        if (pDiff !== 0) return pDiff;
        return b.dateOpened.localeCompare(a.dateOpened);
      });
  }, [auditCases, searchQuery, selectedStatus]);

  // Keep selectedCase synced
  const selectedCase =
    auditCases.find((c) => c.id === selectedCaseId) || filteredCases[0] || auditCases[0];

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const created = createAuditCase(targetInstId, newPriority, newSummary.trim(), [
      'Inquiry initiated by regulatory auditor desk',
    ]);
    setSelectedCaseId(created.id);
    setNewCaseModalOpen(false);
    setNewSummary('');
    showToast(`Audit case ${created.id} initiated`, 'success');
  };

  const handleSendClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !clarificationNoticeText.trim()) return;

    requestCaseClarification(selectedCase.id, clarificationNoticeText.trim());
    setClarificationNoticeText('');
    setShowClarificationForm(false);
    showToast(`Clarification notice dispatched for ${selectedCase.id}`, 'info');
  };

  const handleRecordInstitutionReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !institutionReplyText.trim()) return;

    addCaseResponse(
      selectedCase.id,
      institutionResponder.trim(),
      institutionReplyText.trim(),
      `DOC-REPLY-${Date.now().toString().slice(-4)}.pdf (Simulated)`
    );
    setInstitutionReplyText('');
    setShowReplyForm(false);
    showToast(`Recorded response for ${selectedCase.id}`, 'neutral');
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !decisionReason.trim()) return;

    updateAuditCaseStatus(selectedCase.id, targetDecisionStatus, decisionReason.trim());
    setShowDecisionModal(false);
    setDecisionReason('');
    showToast(`Case ${selectedCase.id} marked as ${targetDecisionStatus}`, 'success');
  };

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Audit Cases"
        subtitle="Formal inquiry dockets, clarification records, institutional responses, and resolution findings."
        actions={
          <button
            type="button"
            onClick={() => setNewCaseModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Open new docket</span>
          </button>
        }
      />

      {/* Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT LIST: Narrow, Scannable ~340px */}
        <div className="w-full lg:w-[340px] shrink-0 bg-white border border-[#E5E7EB] rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Compact Search & Status Filter */}
          <div className="p-3 border-b border-[#E5E7EB] bg-slate-50/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2457D6]"
              />
            </div>

            {/* Compact Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'Open', label: 'Open' },
                { id: 'Awaiting Institution Response', label: 'Response' },
                { id: 'Escalated', label: 'Escalated' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-2 py-0.5 rounded text-xs whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    selectedStatus === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Left List Items: EXACTLY 5 Essentials */}
          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredCases.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No inquiry dockets match filter.
              </div>
            ) : (
              filteredCases.map((cs) => {
                const isSelected = cs.id === selectedCase?.id;
                const dotColor = {
                  Urgent: 'bg-rose-600',
                  High: 'bg-rose-500',
                  Normal: 'bg-amber-500',
                  Low: 'bg-slate-400',
                }[cs.priority];

                return (
                  <div
                    key={cs.id}
                    onClick={() => setSelectedCaseId(cs.id)}
                    className={`p-3.5 cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-[3px] border-l-[#2457D6]'
                        : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    {/* Row 1: Priority dot + Case ID (bold 14px mono) & Status chip */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                          title={`Priority: ${cs.priority}`}
                        />
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {cs.id}
                        </span>
                      </div>
                      <StatusChip label={cs.decisionStatus} size="sm" />
                    </div>

                    {/* Row 2: Institution name (14px medium) */}
                    <h4 className="text-sm font-medium text-slate-800 truncate">
                      {cs.institutionName}
                    </h4>

                    {/* Row 3: One-line summary (12px muted truncated) */}
                    <p className="text-xs text-slate-500 truncate">
                      {cs.summary}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: All the Detail */}
        <div className="flex-1 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-2xs divide-y divide-[#E5E7EB]">
          {selectedCase ? (
            <>
              {/* 1. Header: Case ID in 24px bold, status chip, priority chip, institution name (16px), primary action buttons */}
              <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {selectedCase.id}
                    </span>
                    <StatusChip label={selectedCase.decisionStatus} size="md" />
                    <SeverityChip severity={selectedCase.priority} size="md" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2">
                    {selectedCase.institutionName}
                  </h3>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowClarificationForm(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    Request clarification
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReplyForm(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    Record response
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDecisionModal(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                  >
                    Update decision
                  </button>
                </div>
              </div>

              {/* 2. Key Facts Row: 4 items (Opened, Reviewer, Academic year, Institution response) */}
              <div className="p-6 bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                    Opened Date
                  </span>
                  <span className="text-sm font-semibold font-mono text-slate-900 mt-1 block tabular-nums">
                    {selectedCase.dateOpened}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                    Assigned Reviewer
                  </span>
                  <span className="text-sm font-semibold text-slate-900 mt-1 block truncate">
                    {selectedCase.assignedReviewer}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                    Academic Year
                  </span>
                  <span className="text-sm font-semibold text-slate-900 mt-1 block">
                    AY {selectedCase.academicYear}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                    Institution Response
                  </span>
                  <span className="text-sm font-semibold text-slate-900 mt-1 block truncate">
                    {selectedCase.institutionResponseStatus}
                  </span>
                </div>
              </div>

              {/* 3. Summary in 1-3 sentences */}
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Terms of Inquiry & Summary
                </span>
                <p className="text-sm leading-6 text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {selectedCase.summary}
                </p>
                {selectedCase.closingReason && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                    <strong className="font-semibold">Closing Finding:</strong> {selectedCase.closingReason}
                  </div>
                )}
              </div>

              {/* 4. Tabs: Indicators & Evidence / Notes / Timeline */}
              <div className="p-6 space-y-4">
                <Tabs
                  tabs={[
                    { id: 'evidence', label: 'Indicators & Evidence', count: selectedCase.evidenceNotes?.length || 0 },
                    { id: 'responses', label: 'Notes & Statements', count: selectedCase.institutionResponses?.length || 0 },
                    { id: 'timeline', label: 'Case Timeline', count: selectedCase.caseTimeline?.length || 0 },
                  ]}
                  activeTab={activeTab}
                  onChange={(id) => setActiveTab(id as any)}
                />

                {/* Tab 1: Evidence */}
                {activeTab === 'evidence' && (
                  <div className="space-y-3 pt-1 text-xs">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Evidentiary Findings on Record
                    </span>
                    <div className="space-y-2">
                      {selectedCase.evidenceNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-start gap-2.5 font-mono text-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    {selectedCase.relatedExceptionIds && selectedCase.relatedExceptionIds.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-medium text-slate-500 block mb-1.5">
                          Linked Exceptions
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedCase.relatedExceptionIds.map((exId) => (
                            <span
                              key={exId}
                              className="font-mono text-xs font-medium text-[#2457D6] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded"
                            >
                              {exId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Institutional Notes & Replies */}
                {activeTab === 'responses' && (
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Recorded Statements</span>
                      <span className="text-xs text-slate-500">
                        Response Status: <strong>{selectedCase.institutionResponseStatus}</strong>
                      </span>
                    </div>

                    {selectedCase.institutionResponses.length === 0 ? (
                      <div className="p-6 border border-dashed border-slate-300 rounded-lg text-slate-400 text-center">
                        No formal institutional response recorded yet.
                      </div>
                    ) : (
                      selectedCase.institutionResponses.map((r, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-blue-950">{r.responder}</span>
                            <span className="font-mono text-xs text-slate-500">{r.timestamp}</span>
                          </div>
                          <p className="text-slate-800 text-xs leading-relaxed">{r.statement}</p>
                          {r.referenceDocument && (
                            <div className="pt-1 text-xs font-mono text-[#2457D6] flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>{r.referenceDocument}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Timeline */}
                {activeTab === 'timeline' && (
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="space-y-3 border-l-2 border-slate-200 pl-4 ml-2">
                      {selectedCase.caseTimeline.map((item, idx) => (
                        <div key={idx} className="relative pb-2">
                          <span className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-[#2457D6] ring-4 ring-white" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900">{item.event}</span>
                            <span className="font-mono text-slate-400">{item.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {item.actor} {item.note && `— ${item.note}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clarification Form Inline */}
              {showClarificationForm && (
                <form onSubmit={handleSendClarification} className="p-6 bg-blue-50/60 border-t border-blue-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-950">Issue Formal Clarification Notice</h4>
                    <button
                      type="button"
                      onClick={() => setShowClarificationForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={clarificationNoticeText}
                    onChange={(e) => setClarificationNoticeText(e.target.value)}
                    placeholder="Provide specific points requiring institution registrar response..."
                    rows={3}
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2457D6]"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClarificationForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md"
                    >
                      Dispatch notice
                    </button>
                  </div>
                </form>
              )}

              {/* Record Response Form Inline */}
              {showReplyForm && (
                <form onSubmit={handleRecordInstitutionReply} className="p-6 bg-amber-50/60 border-t border-amber-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-amber-950">Record Institutional Statement</h4>
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Responding Officer</label>
                    <input
                      type="text"
                      value={institutionResponder}
                      onChange={(e) => setInstitutionResponder(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-200 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Statement</label>
                    <textarea
                      value={institutionReplyText}
                      onChange={(e) => setInstitutionReplyText(e.target.value)}
                      placeholder="Enter the official explanation or evidentiary document reference..."
                      rows={3}
                      className="w-full p-2.5 bg-white border border-amber-200 rounded-md"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                    >
                      Save statement
                    </button>
                  </div>
                </form>
              )}

              {/* Decision Modal Form */}
              {showDecisionModal && (
                <form onSubmit={handleDecisionSubmit} className="p-6 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">Update Case Decision Status</h4>
                    <button
                      type="button"
                      onClick={() => setShowDecisionModal(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">New Decision Status</label>
                      <select
                        value={targetDecisionStatus}
                        onChange={(e) => setTargetDecisionStatus(e.target.value as CaseDecisionStatus)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-md"
                      >
                        <option value="Cleared">Cleared (Verified Compliant)</option>
                        <option value="Under Review">Under Review (Scrutiny Active)</option>
                        <option value="Escalated">Escalated (Formal Notice)</option>
                        <option value="Corrected">Corrected (Data Rectified)</option>
                        <option value="Awaiting Institution Response">Awaiting Institution Response</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Finding Reason / Note</label>
                      <input
                        type="text"
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Regulatory justification on record..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDecisionModal(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                    >
                      Confirm status
                    </button>
                  </div>
                </form>
              )}

              {/* 5. One-line safeguard caption */}
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
                AERVIS review-priority indicator for regulatory triage, not a finding of fraud or misconduct.
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select an inquiry case to view details.
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateCaseSubmit}
            className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs text-slate-900 space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-900">Initiate Audit Inquiry Docket</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Target Institution</label>
              <select
                value={targetInstId}
                onChange={(e) => setTargetInstId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Inquiry Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as CasePriority)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Terms of Inquiry</label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="State the regulatory scope of the inquiry..."
                rows={3}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewCaseModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2457D6] hover:bg-blue-700 rounded-md"
              >
                Create docket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
