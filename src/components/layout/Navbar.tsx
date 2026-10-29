import React, { useState } from 'react';
import {
  Calendar,
  UserCheck,
  Search,
  CheckCircle2,
  Info,
  ChevronDown,
  RotateCcw,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../ui/ToastContext';
import { NavSection } from './Sidebar';
import { DemoRole, AcademicYear } from '../../types';
import { Popover } from '../ui/Popover';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface NavbarProps {
  currentSection: NavSection;
  onOpenCommandPalette: () => void;
  onOpenAboutModal: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Overview',
  institutions: 'Institutions',
  records: 'Enrolment Records',
  submissions: 'Data Submissions',
  exceptions: 'Validation & Exceptions',
  risk: 'Risk Intelligence',
  cases: 'Audit Cases',
  reports: 'Reports',
};

export const Navbar: React.FC<NavbarProps> = ({
  currentSection,
  onOpenCommandPalette,
  onOpenAboutModal,
}) => {
  const {
    settings,
    setRole,
    setAcademicYear,
    institutions,
    setActiveInstitutionForAdmin,
    resetAllData,
  } = useApp();
  const { showToast } = useToast();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const roles: DemoRole[] = ['AICTE Analyst', 'Institution Administrator', 'Auditor'];
  const years: AcademicYear[] = ['2024-25', '2023-24', '2025-26'];

  const handleResetConfirm = () => {
    resetAllData();
    setIsResetConfirmOpen(false);
    showToast('Demo dataset reset to initial state', 'info');
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between gap-4 shrink-0 z-20 whitespace-nowrap">
        {/* Left: Breadcrumbs / Shortened title */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <span className="text-xs font-semibold text-[#6B7280]">AERVIS</span>
          <span className="text-[#D1D5DB]">/</span>
          <h1 className="text-sm font-semibold text-[#111827]">
            {SECTION_TITLES[currentSection]}
          </h1>
        </div>

        {/* Center: Global Search (Cmd+K) button */}
        <div className="flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-[#9CA3AF] bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] rounded-md transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span className="font-normal text-[#6B7280]">Quick jump or search...</span>
            </div>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white border border-[#E5E7EB] px-1.5 py-0.2 rounded text-[#6B7280]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Academic Year, Demo Data Popover, Role Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* ONE compact "Demo data" status pill opening Popover */}
          <Popover
            align="right"
            trigger={
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] text-xs text-[#4B5563] transition-colors cursor-pointer">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="font-medium text-[11px]">Demo Data</span>
              </div>
            }
            content={(close: () => void) => (
              <div className="w-64 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                  <Info className="w-4 h-4 text-[#2457D6]" />
                  <span>Synthetic Demo Dataset</span>
                </div>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  This platform is an architectural demonstration. External integrations are simulated with mock signals. No live government APIs are connected.
                </p>
                <div className="pt-1.5 border-t border-[#E5E7EB] flex justify-between items-center text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onOpenAboutModal();
                    }}
                    className="text-[#2457D6] hover:underline font-medium"
                  >
                    Learn more
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="text-[#6B7280] hover:text-[#111827]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          />

          {/* Academic Year Selector */}
          <div className="flex items-center gap-1 text-xs text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span className="text-[11px] text-[#6B7280]">AY:</span>
            <select
              value={settings.activeAcademicYear}
              onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
              aria-label="Academic Year Cycle"
              className="bg-transparent font-medium text-[#111827] text-xs focus:outline-none cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Persona / Role Selector Popover */}
          <Popover
            align="right"
            trigger={
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-xs font-medium text-[#111827] transition-colors cursor-pointer">
                <UserCheck className="w-3.5 h-3.5 text-[#2457D6]" />
                <span className="truncate max-w-[130px]">{settings.currentRole}</span>
                <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
              </div>
            }
            content={(close: () => void) => (
              <div className="w-64 py-1 text-xs">
                <div className="px-3 pt-2 pb-1.5 border-b border-[#F3F4F6]">
                  <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    Demo Role Simulation
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5 leading-tight">
                    UI simulation only, not production access control
                  </p>
                </div>

                <div className="py-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F3F4F6] transition-colors ${
                        settings.currentRole === r
                          ? 'text-[#2457D6] font-semibold bg-blue-50/40'
                          : 'text-[#374151]'
                      }`}
                    >
                      <span>{r}</span>
                      {settings.currentRole === r && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2457D6]" />
                      )}
                    </button>
                  ))}
                </div>

                {settings.currentRole === 'Institution Administrator' && (
                  <div className="px-3 py-2 border-t border-[#F3F4F6] bg-[#F9FAFB]/70">
                    <label className="block text-[10px] font-semibold text-[#6B7280] mb-1">
                      Designated College Scope
                    </label>
                    <select
                      value={settings.activeInstitutionIdForAdmin}
                      onChange={(e) => setActiveInstitutionForAdmin(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E5E7EB] rounded px-2 py-1 text-[#111827] focus:outline-none focus:border-[#2457D6]"
                    >
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border-t border-[#F3F4F6] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setIsResetConfirmOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset demo data...</span>
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      </header>

      {/* Reset Demo Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset demo dataset to initial state?"
        description="This will restore all student records, institutions, exceptions, cases, and audit logs back to the clean baseline state. Any custom overrides or uploaded records will be cleared."
        confirmLabel="Reset demo data"
        isDestructive={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
