import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-[#E5E7EB] max-w-lg w-full p-6 text-[#111827] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-[#2457D6] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">About AERVIS Prototype</h2>
              <p className="text-xs text-[#6B7280]">Enrollment Verification & Risk Intelligence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111827]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#4B5563] leading-relaxed">
          <p>
            <strong>AERVIS</strong> is a proposed architectural software prototype for the All India Council for Technical Education (AICTE) to demonstrate centralized student enrolment verification, cross-institution duplicate collision detection, approved intake reconciliation, and explainable audit triage.
          </p>
          <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] space-y-1.5 text-[11px]">
            <p className="font-semibold text-[#111827]">Key Demonstration Disclaimers:</p>
            <ul className="list-disc list-inside space-y-1 text-[#4B5563]">
              <li><strong>100% Synthetic Data:</strong> All institution names, student records, identifiers (synthetic APAAR), admission registers, and timestamps are fictional demonstration artifacts.</li>
              <li><strong>Simulated Integration Adapters:</strong> No live government databases, council servers, DigiLocker, or production APAAR APIs are connected. External checks are mock simulations.</li>
              <li><strong>Triaging Heuristics Only:</strong> Priority risk scores (0–100) are operational heuristics designed to guide auditor workflow. They never constitute a statutory finding of misconduct or fraud.</li>
            </ul>
          </div>
          <p className="text-[11px] text-[#6B7280]">
            This software is created exclusively for technical and product evaluation purposes.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#2457D6] hover:bg-blue-700 rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
