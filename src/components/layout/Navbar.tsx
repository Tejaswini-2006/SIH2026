import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Calendar,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavSection } from './Sidebar';
import { DemoRole, AcademicYear } from '../../types';

interface NavbarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Executive Overview',
  institutions: 'Approved Institutions Directory',
  records: 'Student Enrolment Verification Records',
  submissions: 'Data Ingestion & Batch Submissions',
  exceptions: 'Validation Exceptions Queue',
  risk: 'Institutional Risk Intelligence Matrix',
  cases: 'Regulatory Audit & Inquiry Cases',
  reports: 'Statistical Reports & Export Center',
  'audit-trail': 'System Audit Log & Activity Trail',
  settings: 'System Configuration & Simulation Rules',
};

export const Navbar: React.FC<NavbarProps> = ({ currentSection, onSelectSection }) => {
  const { settings, setRole, setAcademicYear, resetAllData, exceptions, auditCases } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const pendingExceptions = exceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed').length;
  const activeCases = auditCases.filter((c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected').length;

  const roles: DemoRole[] = ['AICTE Analyst', 'Institution Administrator', 'Regulatory Auditor'];
  const years: AcademicYear[] = ['2024-25', '2023-24', '2025-26'];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-semibold text-slate-500 tracking-wider">AERVIS</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-900 truncate">
          {SECTION_TITLES[currentSection]}
        </h1>
      </div>

      {/* Middle: Synthetic Data Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        <span className="font-medium">Synthetic Demonstration Dataset</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 text-[11px]">Simulated External Adapters</span>
      </div>

      {/* Right Controls: Academic Year, Role Selector, Reset */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick notification triggers */}
        <div className="hidden sm:flex items-center gap-2">
          {pendingExceptions > 0 && (
            <button
              onClick={() => onSelectSection('exceptions')}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors"
              title="Open Exceptions Queue"
            >
              <span>{pendingExceptions} Exceptions</span>
            </button>
          )}
          {activeCases > 0 && (
            <button
              onClick={() => onSelectSection('cases')}
              className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors"
              title="Open Active Cases"
            >
              <span>{activeCases} Active Cases</span>
            </button>
          )}
        </div>

        {/* Academic Year Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-400">Cycle:</span>
          <select
            value={settings.activeAcademicYear}
            onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
            aria-label="Academic Year Cycle"
            className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                AY {y}
              </option>
            ))}
          </select>
        </div>

        {/* Persona Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 shadow-sm transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[140px]">{settings.currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400">
                SWITCH SIMULATION ROLE
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    settings.currentRole === r ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-medium">{r}</p>
                    <p className="text-[10px] text-slate-400">
                      {r === 'AICTE Analyst'
                        ? 'Full portal triage & risk scoring'
                        : r === 'Institution Administrator'
                        ? 'Batch submission & responses'
                        : 'Audit investigation & overrides'}
                    </p>
                  </div>
                  {settings.currentRole === r && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          onClick={() => setResetConfirmOpen(true)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
          title="Reset Demo Dataset to Factory State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Reset Demo Dataset?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will reload initial synthetic institutions, exceptions, and audit records.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setResetConfirmOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
