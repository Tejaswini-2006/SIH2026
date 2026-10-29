import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Edit3,
  Clock,
  History,
  FileCheck,
} from 'lucide-react';
import { EnrolmentRecord, EnrolmentStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { Drawer } from '../ui/Drawer';
import { Tabs } from '../ui/Tabs';
import { StatusChip } from '../ui/StatusChip';
import { SeverityChip } from '../ui/SeverityChip';
import { useToast } from '../ui/ToastContext';

interface RecordDetailDrawerProps {
  record: EnrolmentRecord;
  onClose: () => void;
}

export const RecordDetailDrawer: React.FC<RecordDetailDrawerProps> = ({ record, onClose }) => {
  const { updateEnrolmentRecord } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'corroboration' | 'history'>('profile');

  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<EnrolmentStatus>(record.enrolmentStatus);
  const [justification, setJustification] = useState('');

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    const prevStatus = record.enrolmentStatus;
    updateEnrolmentRecord(
      record.id,
      {
        enrolmentStatus: newStatus,
        validationStatus: newStatus === 'Withdrawn' || newStatus === 'Cancelled' ? 'Valid' : record.validationStatus,
      },
      justification.trim()
    );

    showToast({
      message: `Updated status to ${newStatus}`,
      type: 'success',
      undoAction: () => {
        updateEnrolmentRecord(record.id, { enrolmentStatus: prevStatus }, 'Undo status update');
      },
      undoLabel: 'Undo',
    });

    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Record Profile' },
    { id: 'corroboration', label: 'Simulated Corroboration' },
    { id: 'history', label: 'Audit History', count: record.history.length },
  ];

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      width="max-w-[560px]"
      badge={
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-[#2457D6] font-medium border border-blue-200">
          STUDENT REF: {record.studentRef}
        </span>
      }
      title={record.maskedStudentName}
      subtitle={`${record.programmeName} · ${record.institutionName}`}
      footer={
        <>
          <span className="text-[#6B7280]">Last updated: {record.lastUpdated}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
          >
            Close
          </button>
        </>
      }
    >
      {/* Status Strip */}
      <div className="grid grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs divide-x divide-[#E5E7EB]">
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Lifecycle Status</span>
          <div className="mt-1">
            <StatusChip
              label={record.enrolmentStatus}
              variant={
                record.enrolmentStatus === 'Active'
                  ? 'success'
                  : record.enrolmentStatus === 'Withdrawn' || record.enrolmentStatus === 'Cancelled'
                  ? 'neutral'
                  : 'warning'
              }
              size="sm"
            />
          </div>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Validation State</span>
          <div className="mt-1">
            <SeverityChip severity={record.validationStatus} size="sm" />
          </div>
        </div>
        <div className="p-3">
          <span className="text-[11px] text-[#6B7280]">Admission Date</span>
          <p className="text-xs font-mono tabular-nums text-[#111827] mt-1 font-medium">{record.admissionDate}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-2 bg-white">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />
      </div>

      {/* Tab Panels */}
      <div className="p-5 text-xs">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {record.exceptionIndicator && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-900">Enrolment Conflict Flag</h4>
                  <p className="text-xs text-rose-800 mt-0.5">{record.exceptionIndicator}</p>
                </div>
              </div>
            )}

            <div className="border border-[#E5E7EB] rounded-lg p-4 space-y-3 bg-white">
              <h4 className="text-xs font-semibold text-[#111827]">Identity & Admission Parameters</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#6B7280]">Masked Student Name</span>
                  <p className="font-medium text-[#111827] mt-0.5">{record.maskedStudentName}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Synthetic APAAR ID (Fictional)</span>
                  <p className="font-mono text-xs font-medium text-[#111827] mt-0.5">{record.syntheticApaarId}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Demographic Category</span>
                  <p className="font-medium text-[#111827] mt-0.5">{record.gender} · {record.category}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#6B7280]">Academic Cycle</span>
                  <p className="font-medium text-[#111827] mt-0.5">AY {record.academicYear}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-[#6B7280]">Institution</span>
                  <p className="font-medium text-[#111827] mt-0.5">{record.institutionName}</p>
                </div>
              </div>
            </div>

            {/* Lifecycle Status Correction Action */}
            <div className="pt-1">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Admission Lifecycle Status</span>
                </button>
              ) : (
                <form onSubmit={handleSaveCorrection} className="p-3.5 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg space-y-3">
                  <h5 className="font-semibold text-[#111827]">Record Correction Form</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4B5563] mb-1">New Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as EnrolmentStatus)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md"
                      >
                        <option value="Active">Active</option>
                        <option value="Withdrawn">Withdrawn (Seat Vacated)</option>
                        <option value="Transferred">Transferred</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Pending Review">Pending Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#4B5563] mb-1">Justification Reason</label>
                      <input
                        type="text"
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="e.g. Surrender certificate #449"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs text-[#6B7280] hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md"
                    >
                      Save Correction
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Simulated Corroboration */}
        {activeTab === 'corroboration' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2457D6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#111827]">Corroboration Signals</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    <strong>Simulated — No live connection.</strong> Mock external adapters simulate identity and seat allotment checks.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden divide-y divide-[#F3F4F6]">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#111827]">Admission Register Match</p>
                  <p className="text-[11px] text-[#6B7280]">Presence in college ERP admission roster</p>
                </div>
                <StatusChip
                  label={record.corroboration.admissionRecordPresent ? 'Confirmed' : 'Absent'}
                  variant={record.corroboration.admissionRecordPresent ? 'success' : 'danger'}
                  size="sm"
                />
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#111827]">Approved Programme Mapping</p>
                  <p className="text-[11px] text-[#6B7280]">Matches council-sanctioned EoA listing</p>
                </div>
                <StatusChip
                  label={record.corroboration.programmeMappingValid ? 'Verified' : 'Invalid'}
                  variant={record.corroboration.programmeMappingValid ? 'success' : 'danger'}
                  size="sm"
                />
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#111827]">Institutional Supporting Evidence</p>
                  <p className="text-[11px] text-[#6B7280]">Allotment order or fee receipt</p>
                </div>
                <StatusChip
                  label={record.corroboration.supportingEvidenceAvailable ? 'Available' : 'Pending'}
                  variant={record.corroboration.supportingEvidenceAvailable ? 'neutral' : 'warning'}
                  size="sm"
                />
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#111827]">External Adapter Signal</p>
                  <p className="text-[11px] text-[#6B7280]">{record.corroboration.evidenceSource}</p>
                </div>
                <StatusChip
                  label={record.corroboration.externalAdapterStatus}
                  variant={
                    record.corroboration.externalAdapterStatus === 'Verified in demo'
                      ? 'success'
                      : record.corroboration.externalAdapterStatus === 'Pending Review'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#F9FAFB] rounded text-[11px] text-[#6B7280] space-y-1">
              <div><strong>Signal Timestamp:</strong> <span className="font-mono">{record.corroboration.evidenceTimestamp}</span></div>
              <div><strong>Notes:</strong> {record.corroboration.notes}</div>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {record.history.map((h, idx) => (
              <div key={idx} className="p-3 border border-[#E5E7EB] rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center font-medium text-[#111827]">
                  <span>{h.action}</span>
                  <span className="font-mono text-[11px] text-[#6B7280]">{h.timestamp}</span>
                </div>
                <p className="text-[#4B5563]">{h.details}</p>
                <p className="text-[10px] text-[#6B7280]">Actor: {h.actor}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
