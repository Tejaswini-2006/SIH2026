import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DisclaimerBanner } from './components/layout/DisclaimerBanner';

import { OverviewView } from './components/views/OverviewView';
import { InstitutionsView } from './components/views/InstitutionsView';
import { EnrolmentRecordsView } from './components/views/EnrolmentRecordsView';
import { SubmissionsView } from './components/views/SubmissionsView';
import { ExceptionsView } from './components/views/ExceptionsView';
import { RiskIntelligenceView } from './components/views/RiskIntelligenceView';
import { AuditCasesView } from './components/views/AuditCasesView';
import { ReportsView } from './components/views/ReportsView';
import { AuditTrailView } from './components/views/AuditTrailView';
import { SettingsView } from './components/views/SettingsView';

function MainAppShell() {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [selectedInstIdForDirectory, setSelectedInstIdForDirectory] = useState<string | null>(null);
  const [studentRecordsInstFilter, setStudentRecordsInstFilter] = useState<string | null>(null);

  const handleSelectInstitutionFromOverview = (instId: string) => {
    setSelectedInstIdForDirectory(instId);
    setCurrentSection('institutions');
  };

  const handleNavigateToRecordsFromInstitution = (institutionName: string) => {
    setStudentRecordsInstFilter(institutionName);
    setCurrentSection('records');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* 1. Persistent Left Navigation Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          if (sec !== 'records') {
            setStudentRecordsInstFilter(null);
          }
          if (sec !== 'institutions') {
            setSelectedInstIdForDirectory(null);
          }
          setCurrentSection(sec);
        }}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Toolbar */}
        <Navbar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
        />

        {/* Prototype Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Viewport Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/60">
          {currentSection === 'overview' && (
            <OverviewView
              onNavigate={(sec) => setCurrentSection(sec)}
              onSelectInstitution={handleSelectInstitutionFromOverview}
            />
          )}

          {currentSection === 'institutions' && (
            <InstitutionsView
              initialSelectedId={selectedInstIdForDirectory}
              onNavigateToRecords={handleNavigateToRecordsFromInstitution}
              onNavigateToCases={() => setCurrentSection('cases')}
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

          {currentSection === 'audit-trail' && <AuditTrailView />}

          {currentSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
