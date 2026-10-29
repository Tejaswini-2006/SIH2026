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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tooltip } from '../ui/Tooltip';

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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { exceptions, auditCases, institutions, settings } = useApp();

  // Critical counts
  const blockingCount = exceptions.filter(
    (e) => e.severity === 'Blocking Error' && e.status !== 'Resolved' && e.status !== 'Dismissed'
  ).length;
  const activeCasesCount = auditCases.filter(
    (c) => c.decisionStatus !== 'Cleared' && c.decisionStatus !== 'Corrected'
  ).length;

  const navGroups = [
    {
      group: 'MONITOR',
      items: [
        { id: 'overview' as NavSection, label: 'Overview', icon: LayoutDashboard },
        { id: 'institutions' as NavSection, label: 'Institutions', icon: Building2 },
        { id: 'records' as NavSection, label: 'Enrolment Records', icon: Users },
      ],
    },
    {
      group: 'OPERATE',
      items: [
        { id: 'submissions' as NavSection, label: 'Data Submissions', icon: UploadCloud },
        {
          id: 'exceptions' as NavSection,
          label: 'Validation & Exceptions',
          icon: AlertTriangle,
          badge: blockingCount > 0 ? blockingCount : undefined,
          isCritical: blockingCount > 0, // only red for critical blocking errors
        },
        {
          id: 'cases' as NavSection,
          label: 'Audit Cases',
          icon: FolderKanban,
          badge: activeCasesCount > 0 ? activeCasesCount : undefined,
          isCritical: false, // neutral grey badge
        },
      ],
    },
    {
      group: 'ANALYSE',
      items: [
        { id: 'risk' as NavSection, label: 'Risk Intelligence', icon: ShieldAlert },
        { id: 'reports' as NavSection, label: 'Reports', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'GOVERN',
      items: [
        { id: 'audit-trail' as NavSection, label: 'Audit Trail', icon: History },
        { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } bg-[#0B1F3A] text-slate-300 flex flex-col shrink-0 select-none border-r border-[#0B1F3A] transition-all duration-150 relative z-30`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-[#2457D6] flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 overflow-hidden">
              <span className="text-base font-semibold tracking-tight text-white block truncate">
                AERVIS
              </span>
              <span className="text-[11px] text-slate-400 block truncate -mt-0.5">
                AICTE Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 tracking-wider">
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;

              const buttonContent = (
                <button
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
                  } py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border-l-2 border-[#2457D6] pl-[8px]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.2 rounded font-medium tabular-nums ${
                        item.isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );

              return isCollapsed ? (
                <Tooltip key={item.id} content={item.label} position="right">
                  {buttonContent}
                </Tooltip>
              ) : (
                <React.Fragment key={item.id}>{buttonContent}</React.Fragment>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 text-xs">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-300">
              {settings.currentRole.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-slate-300 font-medium truncate text-xs">
                {settings.currentRole}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                Role Simulation
              </span>
            </div>
          </div>
        ) : (
          <Tooltip content={`Role: ${settings.currentRole}`} position="right">
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300 cursor-pointer">
              {settings.currentRole.charAt(0)}
            </div>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
