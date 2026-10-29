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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { AuditCase, CaseDecisionStatus, CasePriority } from '../../types';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { FilterBar } from '../ui/FilterBar';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';

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
  const [institutionResponder, setInstitutionResponder] = useState(
    'Registrar / Examination Controller'
  );
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
    setDecisionModalOpen(false);
    setDecisionReason('');
    showToast(`Case ${selectedCase.id} marked as ${targetDecisionStatus}`, 'success');
  };

  const filterDropdowns = [
    {
      id: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Active Cases (Under Inquiry)', value: 'active' },
        { label: 'All Statuses', value: 'all' },
        { label: 'Open', value: 'Open' },
        { label: 'Awaiting Institution Response', value: 'Awaiting Institution Response' },
        { label: 'Under Review', value: 'Under Review' },
        { label: 'Cleared', value: 'Cleared' },
        { label: 'Corrected', value: 'Corrected' },
        { label: 'Escalated', value: 'Escalated' },
      ],
      onChange: (val: string) => setSelectedStatus(val),
    },
    {
      id: 'priority',
      label: 'Priority',
      value: selectedPriority,
      options: [
        { label: 'All Priorities', value: 'all' },
        { label: 'Urgent', value: 'Urgent' },
        { label: 'High', value: 'High' },
        { label: 'Normal', value: 'Normal' },
        { label: 'Low', value: 'Low' },
      ],
      onChange: (val: string) => setSelectedPriority(val),
    },
  ];

  const activeChips = [];
  if (selectedStatus !== 'active') {
    activeChips.push({
      label: `Status: ${selectedStatus}`,
      onRemove: () => setSelectedStatus('active'),
    });
  }
  if (selectedPriority !== 'all') {
    activeChips.push({
      label: `Priority: ${selectedPriority}`,
      onRemove: () => setSelectedPriority('all'),
    });
  }

  return (
    <div className="max-w-[1360px] mx-auto space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Audit Cases"
        subtitle="End-to-end regulatory case management for institutional intake discrepancies, showcause inquiries, and compliance outcomes."
        actions={
          <button
            type="button"
            onClick={() => setNewCaseModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Open New Audit Case</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by case ID, institution, or summary..."
        dropdowns={filterDropdowns}
        activeChips={activeChips}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedStatus('active');
          setSelectedPriority('all');
        }}
        totalCount={auditCases.length}
        filteredCount={filteredCases.length}
      />

      {/* Main Split Grid: Left Case List (5 cols) / Right Full Case File & Timeline (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Active Inquiry Docket */}
        <div className="lg:col-span-5">
          <Card
            title="Active Inquiry Docket"
            subtitle={`${filteredCases.length} cases matching filters`}
            noPadding
          >
            <div className="divide-y divide-[#F3F4F6] max-h-[580px] overflow-y-auto">
              {filteredCases.map((cs) => {
                const isSelected = cs.id === selectedCase?.id;
                return (
                  <div
                    key={cs.id}
                    onClick={() => setSelectedCaseId(cs.id)}
                    className={`p-3.5 cursor-pointer transition-colors space-y-1.5 ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-[#111827]">
                          {cs.id}
                        </span>
                        <SeverityChip status={cs.priority} />
                      </div>
                      <span className="text-[11px] text-[#6B7280] tabular-nums">{cs.dateOpened}</span>
                    </div>

                    <h4 className="font-medium text-xs text-[#111827] truncate">
                      {cs.institutionName}
                    </h4>
                    <p className="text-[11px] text-[#4B5563] line-clamp-1">{cs.summary}</p>

                    <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1">
                      <span>
                        Status:{' '}
                        <strong className="text-[#111827] font-medium">{cs.decisionStatus}</strong>
                      </span>
                      <span className="truncate max-w-[120px]">{cs.assignedReviewer.split('(')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] bg-[#F9FAFB]">
              Case updates automatically log to the local audit trail.
            </div>
          </Card>
        </div>

        {/* Right Column: Case File & Interactive Timeline */}
        <div className="lg:col-span-7">
          <Card>
            {selectedCase ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-3.5 border-b border-[#E5E7EB] gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#111827]">
                        {selectedCase.id}
                      </span>
                      <StatusChip
                        label={selectedCase.decisionStatus}
                        variant={
                          selectedCase.decisionStatus === 'Cleared' ||
                          selectedCase.decisionStatus === 'Corrected'
                            ? 'success'
                            : selectedCase.decisionStatus === 'Awaiting Institution Response'
                            ? 'warning'
                            : selectedCase.decisionStatus === 'Escalated'
                            ? 'danger'
                            : 'info'
                        }
                      />
                      <span className="text-xs text-[#6B7280]">· Opened {selectedCase.dateOpened}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] mt-1.5">
                      {selectedCase.institutionName}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Assigned to: {selectedCase.assignedReviewer}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-medium text-[#6B7280] block">
                      Review Priority Score
                    </span>
                    <span className="text-xl font-mono font-bold text-[#111827] tabular-nums">
                      {selectedCase.riskScore}/100
                    </span>
                  </div>
                </div>

                {/* Terms of Inquiry */}
                <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-xs space-y-1.5">
                  <span className="font-semibold text-[#111827]">Case Inquiry Terms</span>
                  <p className="text-[#374151] leading-relaxed">{selectedCase.summary}</p>
                  {selectedCase.closingReason && (
                    <div className="mt-2 pt-2 border-t border-[#E5E7EB] text-emerald-800">
                      <strong>Final Decision Finding:</strong> {selectedCase.closingReason}
                    </div>
                  )}
                </div>

                {/* Recorded Institutional Responses */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111827]">
                      Institutional Submissions & Replies
                    </span>
                    <span className="text-[11px] text-[#6B7280] font-mono">
                      Status: {selectedCase.institutionResponseStatus}
                    </span>
                  </div>

                  {selectedCase.institutionResponses.length === 0 ? (
                    <div className="p-3 border border-dashed border-[#D1D5DB] rounded-md text-[#9CA3AF] text-center text-xs">
                      No formal institutional statement recorded yet.
                    </div>
                  ) : (
                    selectedCase.institutionResponses.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-blue-50/40 border border-blue-200 rounded-md space-y-1"
                      >
                        <div className="flex justify-between font-medium text-blue-950">
                          <span>{r.responder}</span>
                          <span className="text-[#6B7280] font-mono text-[10px]">{r.timestamp}</span>
                        </div>
                        <p className="text-[#374151]">{r.statement}</p>
                        {r.referenceDocument && (
                          <div className="text-[10px] font-mono text-[#2457D6] flex items-center gap-1 pt-1">
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
                  <span className="font-semibold text-[#111827]">Case Milestone Timeline</span>
                  <div className="space-y-2 border-l-2 border-[#E5E7EB] pl-3 ml-1.5">
                    {selectedCase.caseTimeline.map((item, idx) => (
                      <div key={idx} className="space-y-0.5 relative">
                        <div className="w-2 h-2 rounded-full bg-[#2457D6] absolute -left-[17px] top-1" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#111827]">{item.event}</span>
                          <span className="text-[10px] font-mono text-[#6B7280]">{item.timestamp}</span>
                        </div>
                        <p className="text-[#4B5563] text-[11px]">{item.note}</p>
                        <p className="text-[10px] text-[#6B7280]">Actor: {item.actor}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Inquiry Action Buttons */}
                <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClarificationForm(!showClarificationForm);
                        setShowReplyForm(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#2457D6] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                    >
                      Request Clarification
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyForm(!showReplyForm);
                        setShowClarificationForm(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] rounded-md transition-colors cursor-pointer"
                    >
                      Record Institution Reply
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDecisionModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#111827] hover:bg-black rounded-md transition-colors shadow-xs cursor-pointer"
                  >
                    Record Decision / Escalate
                  </button>
                </div>

                {/* Clarification Notice Inline Form */}
                {showClarificationForm && (
                  <form
                    onSubmit={handleSendClarification}
                    className="p-3 bg-blue-50/70 border border-blue-200 rounded-md space-y-2 text-xs"
                  >
                    <h5 className="font-semibold text-blue-900">
                      Issue Regulatory Notice to Institution
                    </h5>
                    <textarea
                      value={clarificationNoticeText}
                      onChange={(e) => setClarificationNoticeText(e.target.value)}
                      rows={2}
                      placeholder="Enter specific documentation or seat breakdown requested..."
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-md focus:outline-none focus:border-[#2457D6] text-xs text-[#111827]"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClarificationForm(false)}
                        className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-md text-[#4B5563] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#2457D6] text-white rounded-md font-medium hover:bg-blue-700 cursor-pointer"
                      >
                        Dispatch Notice
                      </button>
                    </div>
                  </form>
                )}

                {/* Institution Response Recording Inline Form */}
                {showReplyForm && (
                  <form
                    onSubmit={handleRecordInstitutionReply}
                    className="p-3 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md space-y-2 text-xs"
                  >
                    <h5 className="font-semibold text-[#111827]">
                      Record Received Institutional Reply
                    </h5>
                    <input
                      type="text"
                      value={institutionResponder}
                      onChange={(e) => setInstitutionResponder(e.target.value)}
                      placeholder="Responder name & designation"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-md text-xs focus:outline-none focus:border-[#2457D6]"
                      required
                    />
                    <textarea
                      value={institutionReplyText}
                      onChange={(e) => setInstitutionReplyText(e.target.value)}
                      rows={2}
                      placeholder="Institution statement and justification text..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded-md text-xs focus:outline-none focus:border-[#2457D6]"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReplyForm(false)}
                        className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-md text-[#4B5563] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#111827] text-white rounded-md font-medium hover:bg-black cursor-pointer"
                      >
                        Save Reply to File
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-[#9CA3AF] text-xs">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#9CA3AF]" />
                <p>Select a case from the docket to inspect details and history.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Decision / Escalation Modal */}
      {decisionModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-md w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Record Case Decision Status</h3>
            <p className="text-xs text-[#6B7280]">
              Update decision milestone for{' '}
              <strong className="font-mono text-[#111827]">{selectedCase.id}</strong> (
              {selectedCase.institutionName}).
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#374151] mb-1">New Decision Status</label>
                <select
                  value={targetDecisionStatus}
                  onChange={(e) => setTargetDecisionStatus(e.target.value as CaseDecisionStatus)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6]"
                >
                  <option value="Cleared">Cleared (Compliance Satisfied)</option>
                  <option value="Corrected">Corrected (Quota Adjusted / Seats Vacated)</option>
                  <option value="Under Review">Under Review (Continuing Inquiry)</option>
                  <option value="Escalated">Escalated (Referred to Executive Council)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  Audit Finding & Justification
                </label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  placeholder="Document the formal finding, quota orders checked, or escalation basis..."
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6] text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-md w-full p-5 text-[#111827] space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Open New Audit Case</h3>
            <p className="text-xs text-[#6B7280]">
              Initiate a formal review docket for an AICTE-approved institution.
            </p>

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#374151] mb-1">Target Institution</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6]"
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  Priority Classification
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6]"
                >
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Normal">Normal Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  Inquiry Terms & Allegation Details
                </label>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={3}
                  placeholder="Summarize the observed intake discrepancy or conflict..."
                  className="w-full px-2.5 py-1.5 bg-[#F9FAFB] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#2457D6] text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setNewCaseModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-[#F3F4F6] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md shadow-xs cursor-pointer"
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
