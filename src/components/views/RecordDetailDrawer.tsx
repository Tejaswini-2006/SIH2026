import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { EnrolmentRecord, EnrolmentStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface RecordDetailDrawerProps {
  record: EnrolmentRecord;
  onClose: () => void;
}

export const RecordDetailDrawer: React.FC<RecordDetailDrawerProps> = ({ record, onClose }) => {
  const { updateEnrolmentRecord, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'corroboration' | 'history'>('details');

  // Correction Form
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<EnrolmentStatus>(record.enrolmentStatus);
  const [justification, setJustification] = useState('');

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;

    updateEnrolmentRecord(
      record.id,
      {
        enrolmentStatus: newStatus,
        validationStatus: newStatus === 'Withdrawn' || newStatus === 'Cancelled' ? 'Valid' : record.validationStatus,
      },
      justification.trim()
    );
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                STUDENT REF: {record.studentRef}
              </span>
              <span className="text-xs text-slate-500 font-medium">AY {record.academicYear}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              {record.maskedStudentName} · {record.programmeName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{record.institutionName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs divide-x divide-slate-100">
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Lifecycle Status</span>
            <div className="mt-1">
              <span
                className={`px-2 py-0.5 rounded font-medium text-[11px] inline-block ${
                  record.enrolmentStatus === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : record.enrolmentStatus === 'Withdrawn' || record.enrolmentStatus === 'Cancelled'
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {record.enrolmentStatus}
              </span>
            </div>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Validation Status</span>
            <div className="mt-1">
              <span
                className={`px-2 py-0.5 rounded font-medium text-[11px] inline-block ${
                  record.validationStatus === 'Valid'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : record.validationStatus === 'Duplicate Candidate'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {record.validationStatus}
              </span>
            </div>
          </div>
          <div className="p-3">
            <span className="text-[11px] text-slate-400">Admission Date</span>
            <p className="text-xs font-mono font-medium text-slate-800 mt-1">{record.admissionDate}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 gap-6 text-xs font-medium text-slate-500 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Record Profile
          </button>
          <button
            onClick={() => setActiveTab('corroboration')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'corroboration'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Simulated Corroboration Signals
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Audit History ({record.history.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Tab 1: Profile & Exception */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              {record.exceptionIndicator && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-rose-900">Enrolment Conflict Flag</h4>
                    <p className="text-xs text-rose-800 mt-0.5">{record.exceptionIndicator}</p>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white">
                <h4 className="text-xs font-bold text-slate-900">Synthetic Student Identity Attributes</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="text-[11px] text-slate-400">Masked Student Name</span>
                    <p className="font-medium text-slate-900 mt-0.5">{record.maskedStudentName}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Synthetic APAAR ID (Fictional)</span>
                    <p className="font-mono font-medium text-slate-900 mt-0.5">{record.syntheticApaarId}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Gender / Demographic Category</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {record.gender} · {record.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Institution Code</span>
                    <p className="font-mono text-slate-900 mt-0.5">{record.institutionId}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Programme Enrolled</span>
                    <p className="font-medium text-slate-900 mt-0.5">{record.programmeName}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Last Portal Update</span>
                    <p className="font-mono text-slate-900 mt-0.5">{record.lastUpdated}</p>
                  </div>
                </div>
              </div>

              {/* Correction Form / Action */}
              <div className="pt-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Apply Record Correction</span>
                  </button>
                ) : (
                  <form onSubmit={handleSaveCorrection} className="p-4 border border-blue-200 bg-blue-50/40 rounded-lg space-y-3">
                    <h5 className="font-semibold text-slate-900">Record Correction Form</h5>
                    <p className="text-slate-500 text-[11px]">
                      Modify admission lifecycle status (e.g. mark Withdrawn or Cancelled to clear seat collision). All modifications are permanently recorded in the system audit trail.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">New Lifecycle Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as EnrolmentStatus)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Withdrawn">Withdrawn (Seat Vacated)</option>
                          <option value="Transferred">Transferred</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Pending Review">Pending Review</option>
                          <option value="Superseded">Superseded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Audit Justification</label>
                        <input
                          type="text"
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="e.g. Received candidate withdrawal receipt #991"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                      >
                        Commit Correction
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Simulated Corroboration */}
          {activeTab === 'corroboration' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Simulated Corroboration Framework</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      <strong>Simulated — No live government API connection.</strong> External adapter checks simulate multi-signal institutional validation. No live personal attendance, DigiLocker, or examination records are queried.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Institution Admission Register Match</p>
                    <p className="text-[11px] text-slate-400">Presence in college ERP admission roster</p>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {record.corroboration.admissionRecordPresent ? 'Confirmed in demo' : 'Absent'}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Approved Programme Code Mapping</p>
                    <p className="text-[11px] text-slate-400">Programme matches council-sanctioned EoA listing</p>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {record.corroboration.programmeMappingValid ? 'Verified' : 'Invalid Mapping'}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Supporting Institutional Evidence</p>
                    <p className="text-[11px] text-slate-400">Allotment letter or fee verification record</p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {record.corroboration.supportingEvidenceAvailable ? 'Available on file' : 'Pending submission'}
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">External Verification Adapter Signal</p>
                    <p className="text-[11px] text-slate-400">{record.corroboration.evidenceSource}</p>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold ${
                      record.corroboration.externalAdapterStatus === 'Verified in demo'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : record.corroboration.externalAdapterStatus === 'Pending Review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {record.corroboration.externalAdapterStatus}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 text-[11px] space-y-1">
                <div><strong>Signal Timestamp:</strong> <span className="font-mono">{record.corroboration.evidenceTimestamp}</span></div>
                <div><strong>Evidence Remarks:</strong> {record.corroboration.notes}</div>
              </div>
            </div>
          )}

          {/* Tab 3: History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {record.history.map((h, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{h.action}</span>
                    <span className="text-[11px] font-mono text-slate-400">{h.timestamp}</span>
                  </div>
                  <p className="text-slate-600">{h.details}</p>
                  <p className="text-[10px] text-slate-400">Actor: {h.actor}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">ID: {record.id}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
