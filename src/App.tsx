import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/ToastContext';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';
import { CommandPalette } from './components/ui/CommandPalette';
import { AboutModal } from './components/ui/AboutModal';
import { useHashRouter } from './utils/useHashRouter';

import { OverviewView } from './components/views/OverviewView';
import { InstitutionsView } from './components/views/InstitutionsView';
import { EnrolmentRecordsView } from './components/views/EnrolmentRecordsView';
import { SubmissionsView } from './components/views/SubmissionsView';
import { ExceptionsView } from './components/views/ExceptionsView';
import { RiskIntelligenceView } from './components/views/RiskIntelligenceView';
import { AuditCasesView } from './components/views/AuditCasesView';
import { ReportsView } from './components/views/ReportsView';

function MainAppShell() {
  const { section: currentSection, params, navigate } = useHashRouter();

  const [selectedInstIdForDirectory, setSelectedInstIdForDirectory] = useState<string | null>(null);
  const [studentRecordsInstFilter, setStudentRecordsInstFilter] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectInstitutionFromOverview = (instId: string) => {
    setSelectedInstIdForDirectory(instId);
    navigate('institutions');
  };

  const handleNavigateToRecordsFromInstitution = (institutionName: string) => {
    setStudentRecordsInstFilter(institutionName);
    navigate('records');
  };

  const handleCommandPaletteNavigate = (sectionName: string, filter?: string) => {
    if (sectionName === 'institutions' && filter) {
      setSelectedInstIdForDirectory(filter);
    } else if (sectionName === 'records' && filter) {
      setStudentRecordsInstFilter(filter);
    }
    navigate(sectionName as NavSection);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F7F9] font-sans text-[#111827]">
      {/* 1. Persistent Left Navigation Sidebar (240px -> 64px rail) */}
      <Sidebar
        currentSection={currentSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onSelectSection={(sec) => {
          if (sec !== 'records') {
            setStudentRecordsInstFilter(null);
          }
          if (sec !== 'institutions') {
            setSelectedInstIdForDirectory(null);
          }
          navigate(sec);
        }}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Toolbar (56px single row) */}
        <Navbar
          currentSection={currentSection}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
        />

        {/* Prototype Disclaimer Banner (Dismissible with localStorage persistence) */}
        <DisclaimerBanner onLearnMore={() => setIsAboutModalOpen(true)} />

        {/* Viewport Scrollable Content with strict 1360px container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-[#F6F7F9]">
          <div className="max-w-[1360px] mx-auto w-full">
            {currentSection === 'overview' && (
              <OverviewView
                onNavigate={(sec) => navigate(sec)}
                onSelectInstitution={handleSelectInstitutionFromOverview}
              />
            )}

            {currentSection === 'institutions' && (
              <InstitutionsView
                initialSelectedId={selectedInstIdForDirectory}
                onNavigateToRecords={handleNavigateToRecordsFromInstitution}
                onNavigateToCases={() => navigate('cases')}
              />
            )}

            {currentSection === 'records' && (
              <EnrolmentRecordsView
                initialInstitutionFilter={studentRecordsInstFilter}
                onClearInitialFilter={() => setStudentRecordsInstFilter(null)}
              />
            )}

            {currentSection === 'submissions' && <SubmissionsView />}

            {currentSection === 'exceptions' && <ExceptionsView />}

            {currentSection === 'risk' && <RiskIntelligenceView />}

            {currentSection === 'cases' && <AuditCasesView />}

            {currentSection === 'reports' && <ReportsView />}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleCommandPaletteNavigate}
      />

      {/* About Demo Dataset & Safeguards Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <MainAppShell />
      </ToastProvider>
    </AppProvider>
  );
}
