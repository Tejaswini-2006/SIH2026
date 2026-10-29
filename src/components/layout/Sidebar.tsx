import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UploadCloud,
  AlertTriangle,
  ShieldAlert,
  FolderKanban,
  FileSpreadsheet,
  History,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavSection =
  | 'overview'
  | 'institutions'
  | 'records'
  | 'submissions'
  | 'exceptions'
  | 'risk'
  | 'cases'
  | 'reports'
  | 'audit-trail'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelectSection }) => {
  const { exceptions, auditCases, institutions, settings } = useApp();

  const activeExceptionsCount = exceptions.filter((e) => e.status !== 'Resolved' && e.status !== 'Dismissed').length;
  const activeCasesCount = auditCases.filter((c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected').length;
  const highRiskCount = institutions.filter((i) => i.reviewPriorityScore >= 70).length;

  const navItems = [
    { id: 'overview' as NavSection, label: 'Overview', icon: LayoutDashboard },
    { id: 'institutions' as NavSection, label: 'Institutions', icon: Building2 },
    { id: 'records' as NavSection, label: 'Enrolment Records', icon: Users },
    { id: 'submissions' as NavSection, label: 'Data Submissions', icon: UploadCloud },
    {
      id: 'exceptions' as NavSection,
      label: 'Validation & Exceptions',
      icon: AlertTriangle,
      badge: activeExceptionsCount > 0 ? activeExceptionsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'risk' as NavSection,
      label: 'Risk Intelligence',
      icon: ShieldAlert,
      badge: highRiskCount > 0 ? `${highRiskCount} High` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'cases' as NavSection,
      label: 'Audit Cases',
      icon: FolderKanban,
      badge: activeCasesCount > 0 ? activeCasesCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    { id: 'reports' as NavSection, label: 'Reports', icon: FileSpreadsheet },
    { id: 'audit-trail' as NavSection, label: 'Audit Trail', icon: History },
    { id: 'settings' as NavSection, label: 'Settings & Roles', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold tracking-wider shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>AERVIS</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">Enrollment & Risk Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 tracking-wider">
          CORE MODULES
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role / Persona Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="px-2 py-1 text-[10px] font-semibold text-slate-400">
          ACTIVE DEMO PERSONA
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
          <div className="w-7 h-7 rounded-full bg-blue-900/60 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
            {settings.currentRole.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{settings.currentRole}</p>
            <p className="text-[10px] text-slate-400 truncate">AICTE Demo Environment</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
