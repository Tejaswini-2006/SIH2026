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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditCase, CaseDecisionStatus, CasePriority } from '../../types';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(auditCases[0]?.id || '');

  // Modals / Form States
  const [newCaseModalOpen, setNewCaseModalOpen] = useState(false);
  const [targetInstId, setTargetInstId] = useState(institutions[0]?.id || '');
  const [newPriority, setNewPriority] = useState<CasePriority>('High');
  const [newSummary, setNewSummary] = useState('');

  // Interactive In-Case Actions
  const [clarificationNoticeText, setClarificationNoticeText] = useState('');
  const [showClarificationForm, setShowClarificationForm] = useState(false);

  const [institutionReplyText, setInstitutionReplyText] = useState('');
  const [institutionResponder, setInstitutionResponder] = useState('Registrar / Examination Controller');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [targetDecisionStatus, setTargetDecisionStatus] = useState<CaseDecisionStatus>('Cleared');
  const [decisionReason, setDecisionReason] = useState('');

  const filteredCases = useMemo(() => {
    return auditCases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.institutionName.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q);

      const matchesPriority = selectedPriority === 'all' || c.priority === selectedPriority;
      const matchesStatus =
        selectedStatus === 'all'
          ? true
          : selectedStatus === 'active'
          ? c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
          : c.decisionStatus === selectedStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [auditCases, searchQuery, selectedPriority, selectedStatus]);

  const selectedCase = auditCases.find((c) => c.id === selectedCaseId) || auditCases[0];

  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;

    const created = createAuditCase(targetInstId, newPriority, newSummary.trim(), [
      'Inquiry initiated by regulatory auditor desk',
    ]);
    setSelectedCaseId(created.id);
    setNewCaseModalOpen(false);
    setNewSummary('');
  };

  const handleSendClarification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !clarificationNoticeText.trim()) return;

    requestCaseClarification(selectedCase.id, clarificationNoticeText.trim());
    setClarificationNoticeText('');
    setShowClarificationForm(false);
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
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !decisionReason.trim()) return;

    updateAuditCaseStatus(selectedCase.id, targetDecisionStatus, decisionReason.trim());
    setDecisionModalOpen(false);
    setDecisionReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Regulatory Audit & Inquiry Cases</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end case management workflow for institutional intake discrepancies, showcause inquiries, and compliance outcomes.
          </p>
        </div>

        <button
          onClick={() => setNewCaseModalOpen(true)}
          className="self-start md:self-auto px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Open New Audit Case</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search case ID, institution, summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by decision status"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="active">Active Cases (Under Inquiry)</option>
              <option value="all">All Statuses ({auditCases.length})</option>
              <option value="Open">Open</option>
              <option value="Awaiting Institution Response">Awaiting Institution Response</option>
              <option value="Under Review">Under Review</option>
              <option value="Cleared">Cleared (Resolved)</option>
              <option value="Corrected">Corrected (Quota Adjusted)</option>
              <option value="Escalated">Escalated (Higher Council)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter by priority"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="High">High Priority</option>
              <option value="Normal">Normal Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Case List / Right Full Case File & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Active Inquiry Docket</h3>
              <span className="text-xs font-mono text-slate-500">{filteredCases.length} Cases</span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-[580px] overflow-y-auto">
              {filteredCases.map((cs) => {
                const isSelected = cs.id === selectedCase?.id;
                return (
                  <div
                    key={cs.id}
                    onClick={() => setSelectedCaseId(cs.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200'
                        : 'hover:bg-slate-50/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{cs.id}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            cs.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : cs.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cs.priority}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{cs.dateOpened}</span>
                    </div>

                    <h4 className="font-medium text-xs text-slate-900 truncate">{cs.institutionName}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{cs.summary}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Status: <strong className="text-slate-700 font-medium">{cs.decisionStatus}</strong></span>
                      <span className="truncate max-w-[120px]">{cs.assignedReviewer.split('(')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Audit case updates automatically log to the local audit trail.
          </div>
        </div>

        {/* Right Column: Case File & Interactive Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-5">
          {selectedCase && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">{selectedCase.id}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        selectedCase.decisionStatus === 'Cleared' || selectedCase.decisionStatus === 'Corrected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedCase.decisionStatus === 'Awaiting Institution Response'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedCase.decisionStatus}
                    </span>
                    <span className="text-xs text-slate-400">· Opened {selectedCase.dateOpened}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedCase.institutionName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned to: {selectedCase.assignedReviewer}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-medium text-slate-400 block">Review Priority Score</span>
                  <span className="text-lg font-mono font-bold text-slate-900">{selectedCase.riskScore}/100</span>
                </div>
              </div>

              {/* Terms of Inquiry */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <span className="font-semibold text-slate-800">Case Inquiry Terms</span>
                <p className="text-slate-700 leading-relaxed">{selectedCase.summary}</p>
                {selectedCase.closingReason && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-emerald-800">
                    <strong>Final Decision Finding:</strong> {selectedCase.closingReason}
                  </div>
                )}
              </div>

              {/* Recorded Institutional Responses */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Institutional Submissions & Replies</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Status: {selectedCase.institutionResponseStatus}
                  </span>
                </div>

                {selectedCase.institutionResponses.length === 0 ? (
                  <div className="p-3 border border-dashed border-slate-200 rounded text-slate-400 text-center">
                    No formal institutional statement recorded yet.
                  </div>
                ) : (
                  selectedCase.institutionResponses.map((r, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-1">
                      <div className="flex justify-between font-medium text-blue-950">
                        <span>{r.responder}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{r.timestamp}</span>
                      </div>
                      <p className="text-slate-700">{r.statement}</p>
                      {r.referenceDocument && (
                        <div className="text-[10px] font-mono text-blue-700 flex items-center gap-1 pt-1">
                          <FileText className="w-3 h-3" />
                          <span>Attached: {r.referenceDocument}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-900">Case Milestone Timeline</span>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1.5">
                  {selectedCase.caseTimeline.map((item, idx) => (
                    <div key={idx} className="space-y-0.5 relative">
                      <div className="w-2 h-2 rounded-full bg-blue-600 absolute -left-[17px] top-1" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{item.event}</span>
                        <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{item.note}</p>
                      <p className="text-[10px] text-slate-400">Actor: {item.actor}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Inquiry Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowClarificationForm(!showClarificationForm);
                      setShowReplyForm(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                  >
                    Request Clarification
                  </button>
                  <button
                    onClick={() => {
                      setShowReplyForm(!showReplyForm);
                      setShowClarificationForm(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                  >
                    Record Institution Reply
                  </button>
                </div>

                <button
                  onClick={() => setDecisionModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
                >
                  Record Decision / Escalate
                </button>
              </div>

              {/* Clarification Notice Drawer / Inline Form */}
              {showClarificationForm && (
                <form onSubmit={handleSendClarification} className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-xs">
                  <h5 className="font-semibold text-blue-900">Issue Regulatory Notice to Institution</h5>
                  <textarea
                    value={clarificationNoticeText}
                    onChange={(e) => setClarificationNoticeText(e.target.value)}
                    rows={2}
                    placeholder="Enter specific documentation or seat breakdown requested..."
                    className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClarificationForm(false)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                    >
                      Dispatch Notice
                    </button>
                  </div>
                </form>
              )}

              {/* Institution Response Recording Inline Form */}
              {showReplyForm && (
                <form onSubmit={handleRecordInstitutionReply} className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-2 text-xs">
                  <h5 className="font-semibold text-slate-900">Record Received Institutional Reply</h5>
                  <input
                    type="text"
                    value={institutionResponder}
                    onChange={(e) => setInstitutionResponder(e.target.value)}
                    placeholder="Responder name & designation"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <textarea
                    value={institutionReplyText}
                    onChange={(e) => setInstitutionReplyText(e.target.value)}
                    rows={2}
                    placeholder="Institution statement and justification text..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                    >
                      Save Reply to File
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Decision / Escalation Modal */}
      {decisionModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Case Decision Status</h3>
            <p className="text-xs text-slate-500">
              Update decision milestone for <strong>{selectedCase.id}</strong> ({selectedCase.institutionName}).
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Decision Status</label>
                <select
                  value={targetDecisionStatus}
                  onChange={(e) => setTargetDecisionStatus(e.target.value as CaseDecisionStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cleared">Cleared (Compliance Satisfied)</option>
                  <option value="Corrected">Corrected (Quota Adjusted / Seats Vacated)</option>
                  <option value="Under Review">Under Review (Continuing Inquiry)</option>
                  <option value="Escalated">Escalated (Referred to Executive Council)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Audit Finding & Justification</label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  placeholder="Document the formal finding, quota orders checked, or escalation basis..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {newCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Open New Audit Case</h3>
            <p className="text-xs text-slate-500">
              Initiate a formal review docket for an AICTE-approved institution.
            </p>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Institution</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority Classification</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Normal">Normal Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Inquiry Terms & Allegation Details</label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={3}
                  placeholder="Summarize the observed intake discrepancy or conflict..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Create Docket & Open Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
