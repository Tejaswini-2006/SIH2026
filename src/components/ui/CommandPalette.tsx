import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Users, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string, filter?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { institutions, records } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const pages = [
    { id: 'overview', title: 'Executive Overview', desc: 'Summary KPIs, intake vs reported enrolment, priority breakdown' },
    { id: 'institutions', title: 'Institutions Directory', desc: 'Approved institutions, quota compliance, and review score' },
    { id: 'records', title: 'Enrolment Records', desc: 'Student-level admission records and corroboration signals' },
    { id: 'submissions', title: 'Data Submissions', desc: 'CSV admission upload and validation receipts' },
    { id: 'exceptions', title: 'Validation & Exceptions', desc: 'Review queue for capacity overruns and collisions' },
    { id: 'risk', title: 'Risk Intelligence', desc: 'Explainable review priority scoring and formula weights' },
    { id: 'cases', title: 'Audit Cases', desc: 'Inquiry dockets and regulatory notices' },
    { id: 'reports', title: 'Reports & Export', desc: 'Statistical compliance reports and CSV exports' },
  ].filter((p) => !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));

  const matchedInstitutions = institutions
    .filter((i) => !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q))
    .slice(0, 4);

  const matchedRecords = records
    .filter((r) => !q || r.studentRef.toLowerCase().includes(q) || r.syntheticApaarId.toLowerCase().includes(q) || r.maskedStudentName.toLowerCase().includes(q))
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 z-50 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl border border-[#E5E7EB] max-w-xl w-full overflow-hidden text-[#111827]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB] gap-2.5">
          <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page, institution, or student reference..."
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-[#9CA3AF] text-[#111827]"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 text-xs divide-y divide-[#F3F4F6]">
          {/* Pages */}
          {pages.length > 0 && (
            <div className="py-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#6B7280]">
                NAVIGATION
              </div>
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onNavigate(p.id);
                    onClose();
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-[#F3F4F6] flex items-center justify-between text-[#111827] group transition-colors"
                >
                  <div>
                    <span className="font-medium">{p.title}</span>
                    <span className="text-[#6B7280] text-[11px] ml-2 font-normal">{p.desc}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {/* Institutions */}
          {matchedInstitutions.length > 0 && (
            <div className="py-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#6B7280]">
                INSTITUTIONS
              </div>
              {matchedInstitutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    onNavigate('institutions', inst.id);
                    onClose();
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-[#F3F4F6] flex items-center justify-between text-[#111827] group transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                    <span className="font-medium truncate">{inst.name}</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">{inst.code}</span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] shrink-0">Intake: {inst.approvedIntake}</span>
                </button>
              ))}
            </div>
          )}

          {/* Student Records */}
          {matchedRecords.length > 0 && (
            <div className="py-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#6B7280]">
                STUDENT RECORDS
              </div>
              {matchedRecords.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    onNavigate('records', r.studentRef);
                    onClose();
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-md hover:bg-[#F3F4F6] flex items-center justify-between text-[#111827] group transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                    <span className="font-mono font-medium text-[11px]">{r.studentRef}</span>
                    <span className="text-[#6B7280] truncate">{r.maskedStudentName}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#6B7280]">{r.syntheticApaarId}</span>
                </button>
              ))}
            </div>
          )}

          {pages.length === 0 && matchedInstitutions.length === 0 && matchedRecords.length === 0 && (
            <div className="py-6 text-center text-xs text-[#6B7280]">
              No matches found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
