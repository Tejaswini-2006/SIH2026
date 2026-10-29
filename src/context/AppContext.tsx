import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Institution,
  EnrolmentRecord,
  ValidationException,
  AuditCase,
  Submission,
  AuditTrailEvent,
  AppSettings,
  DemoRole,
  AcademicYear,
  RiskRuleWeights,
  InstitutionRiskProfile,
} from '../types';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_RECORDS,
  INITIAL_EXCEPTIONS,
  INITIAL_AUDIT_CASES,
  INITIAL_SUBMISSIONS,
  INITIAL_AUDIT_TRAIL,
} from '../data/seedData';
import { calculateInstitutionRisk, DEFAULT_RISK_WEIGHTS } from '../utils/engine';

interface RiskOverrideData {
  score: number;
  reason: string;
  by: string;
  timestamp: string;
}

interface AppContextType {
  institutions: Institution[];
  records: EnrolmentRecord[];
  exceptions: ValidationException[];
  auditCases: AuditCase[];
  submissions: Submission[];
  auditTrail: AuditTrailEvent[];
  settings: AppSettings;
  riskOverrides: Record<string, RiskOverrideData>;
  
  // Actions
  setRole: (role: DemoRole) => void;
  setAcademicYear: (year: AcademicYear) => void;
  updateRuleWeights: (weights: RiskRuleWeights) => void;
  updateTolerance: (pct: number) => void;
  setActiveInstitutionForAdmin: (instId: string) => void;
  resetAllData: () => void;
  
  // Entity mutations
  getInstitutionRisk: (institutionId: string) => InstitutionRiskProfile;
  setInstitutionRiskOverride: (institutionId: string, score: number, reason: string) => void;
  removeInstitutionRiskOverride: (institutionId: string) => void;
  
  resolveException: (exceptionId: string, resolutionNote: string) => void;
  dismissException: (exceptionId: string, dismissalReason: string) => void;
  assignException: (exceptionId: string, reviewerName: string) => void;
  escalateException: (exceptionId: string, reason: string) => void;
  
  createAuditCase: (
    institutionId: string,
    priority: AuditCase['priority'],
    summary: string,
    evidenceNotes: string[]
  ) => AuditCase;
  updateAuditCaseStatus: (caseId: string, status: AuditCase['decisionStatus'], note?: string) => void;
  addCaseResponse: (caseId: string, responder: string, statement: string, refDoc?: string) => void;
  requestCaseClarification: (caseId: string, noticeDetails: string) => void;
  
  updateEnrolmentRecord: (
    recordId: string,
    updates: Partial<EnrolmentRecord>,
    justification: string
  ) => void;
  
  processSubmission: (
    institutionId: string,
    fileName: string,
    rows: Array<Record<string, string>>
  ) => { submission: Submission; exceptionsRaised: number; duplicateCount: number };
  
  logAudit: (
    category: AuditTrailEvent['actionCategory'],
    ref: string,
    details: string,
    outcome: AuditTrailEvent['outcome']
  ) => void;
}

const STORAGE_KEY = 'aervis_application_state_v1';

const DEFAULT_SETTINGS: AppSettings = {
  currentRole: 'AICTE Analyst',
  activeAcademicYear: '2024-25',
  intakeTolerancePercentage: 0,
  ruleWeights: DEFAULT_RISK_WEIGHTS,
  activeInstitutionIdForAdmin: 'inst-01',
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_institutions`);
      return saved ? JSON.parse(saved) : INITIAL_INSTITUTIONS;
    } catch {
      return INITIAL_INSTITUTIONS;
    }
  });

  const [records, setRecords] = useState<EnrolmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_records`);
      return saved ? JSON.parse(saved) : INITIAL_RECORDS;
    } catch {
      return INITIAL_RECORDS;
    }
  });

  const [exceptions, setExceptions] = useState<ValidationException[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_exceptions`);
      return saved ? JSON.parse(saved) : INITIAL_EXCEPTIONS;
    } catch {
      return INITIAL_EXCEPTIONS;
    }
  });

  const [auditCases, setAuditCases] = useState<AuditCase[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_auditCases`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_CASES;
    } catch {
      return INITIAL_AUDIT_CASES;
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_submissions`);
      return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [auditTrail, setAuditTrail] = useState<AuditTrailEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_auditTrail`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_TRAIL;
    } catch {
      return INITIAL_AUDIT_TRAIL;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [riskOverrides, setRiskOverrides] = useState<Record<string, RiskOverrideData>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_riskOverrides`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_institutions`, JSON.stringify(institutions));
      localStorage.setItem(`${STORAGE_KEY}_records`, JSON.stringify(records));
      localStorage.setItem(`${STORAGE_KEY}_exceptions`, JSON.stringify(exceptions));
      localStorage.setItem(`${STORAGE_KEY}_auditCases`, JSON.stringify(auditCases));
      localStorage.setItem(`${STORAGE_KEY}_submissions`, JSON.stringify(submissions));
      localStorage.setItem(`${STORAGE_KEY}_auditTrail`, JSON.stringify(auditTrail));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_riskOverrides`, JSON.stringify(riskOverrides));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, [institutions, records, exceptions, auditCases, submissions, auditTrail, settings, riskOverrides]);

  const logAudit = (
    category: AuditTrailEvent['actionCategory'],
    ref: string,
    details: string,
    outcome: AuditTrailEvent['outcome']
  ) => {
    const newEvent: AuditTrailEvent = {
      id: `TR-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actorRole: settings.currentRole,
      actorName:
        settings.currentRole === 'AICTE Analyst'
          ? 'Dr. Anita Joshi'
          : settings.currentRole === 'Regulatory Auditor'
          ? 'V. Sundaram'
          : 'Institution Registrar',
      actionCategory: category,
      affectedRef: ref,
      details,
      outcome,
    };
    setAuditTrail((prev) => [newEvent, ...prev]);
  };

  const setRole = (role: DemoRole) => {
    setSettings((prev) => ({ ...prev, currentRole: role }));
    logAudit('Settings', 'ROLE-SWITCH', `Switched active demo persona to ${role}`, 'Success');
  };

  const setAcademicYear = (year: AcademicYear) => {
    setSettings((prev) => ({ ...prev, activeAcademicYear: year }));
    logAudit('Settings', 'ACADEMIC-YEAR', `Set active review cycle to ${year}`, 'Success');
  };

  const updateRuleWeights = (weights: RiskRuleWeights) => {
    setSettings((prev) => ({ ...prev, ruleWeights: weights }));
    logAudit('Settings', 'RISK-WEIGHTS', 'Recalibrated institutional risk indicator weighting matrix', 'Modified');
  };

  const updateTolerance = (pct: number) => {
    setSettings((prev) => ({ ...prev, intakeTolerancePercentage: pct }));
    logAudit('Settings', 'TOLERANCE', `Updated approved intake tolerance threshold to ${pct}%`, 'Modified');
  };

  const setActiveInstitutionForAdmin = (instId: string) => {
    setSettings((prev) => ({ ...prev, activeInstitutionIdForAdmin: instId }));
  };

  const resetAllData = () => {
    setInstitutions(INITIAL_INSTITUTIONS);
    setRecords(INITIAL_RECORDS);
    setExceptions(INITIAL_EXCEPTIONS);
    setAuditCases(INITIAL_AUDIT_CASES);
    setSubmissions(INITIAL_SUBMISSIONS);
    setAuditTrail(INITIAL_AUDIT_TRAIL);
    setSettings(DEFAULT_SETTINGS);
    setRiskOverrides({});
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_KEY))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  };

  const getInstitutionRisk = (institutionId: string): InstitutionRiskProfile => {
    const inst = institutions.find((i) => i.id === institutionId);
    if (!inst) {
      return {
        institutionId,
        institutionName: 'Unknown',
        calculatedScore: 0,
        effectiveScore: 0,
        tier: 'Low',
        indicators: [],
        plainExplanation: 'No data',
      };
    }
    const override = riskOverrides[institutionId];
    return calculateInstitutionRisk(inst, records, exceptions, settings.ruleWeights, override);
  };

  const setInstitutionRiskOverride = (institutionId: string, score: number, reason: string) => {
    const override: RiskOverrideData = {
      score,
      reason,
      by: `${settings.currentRole} (Dr. Anita Joshi / Reviewer)`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setRiskOverrides((prev) => ({ ...prev, [institutionId]: override }));
    logAudit('Risk Override', institutionId, `Recorded reasoned score override to ${score}/100: ${reason}`, 'Modified');
  };

  const removeInstitutionRiskOverride = (institutionId: string) => {
    setRiskOverrides((prev) => {
      const next = { ...prev };
      delete next[institutionId];
      return next;
    });
    logAudit('Risk Override', institutionId, 'Cleared manual risk score override to restore calculated heuristic', 'Modified');
  };

  const resolveException = (exceptionId: string, resolutionNote: string) => {
    setExceptions((prev) =>
      prev.map((ex) => {
        if (ex.id === exceptionId) {
          return {
            ...ex,
            status: 'Resolved',
            resolutionNote,
            timeline: [
              ...ex.timeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                action: 'Resolved',
                note: resolutionNote,
              },
            ],
          };
        }
        return ex;
      })
    );
    logAudit('Exception', exceptionId, `Resolved exception: ${resolutionNote}`, 'Closed');
  };

  const dismissException = (exceptionId: string, dismissalReason: string) => {
    setExceptions((prev) =>
      prev.map((ex) => {
        if (ex.id === exceptionId) {
          return {
            ...ex,
            status: 'Dismissed',
            dismissalReason,
            timeline: [
              ...ex.timeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                action: 'Dismissed with Documented Reason',
                note: dismissalReason,
              },
            ],
          };
        }
        return ex;
      })
    );
    logAudit('Exception', exceptionId, `Dismissed exception: ${dismissalReason}`, 'Closed');
  };

  const assignException = (exceptionId: string, reviewerName: string) => {
    setExceptions((prev) =>
      prev.map((ex) => {
        if (ex.id === exceptionId) {
          return {
            ...ex,
            assignedReviewer: reviewerName,
            status: ex.status === 'New' ? 'In Review' : ex.status,
            timeline: [
              ...ex.timeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                action: `Assigned to ${reviewerName}`,
              },
            ],
          };
        }
        return ex;
      })
    );
    logAudit('Exception', exceptionId, `Assigned reviewer: ${reviewerName}`, 'Modified');
  };

  const escalateException = (exceptionId: string, reason: string) => {
    const targetEx = exceptions.find((e) => e.id === exceptionId);
    if (!targetEx) return;

    setExceptions((prev) =>
      prev.map((ex) => {
        if (ex.id === exceptionId) {
          return {
            ...ex,
            status: 'Escalated',
            timeline: [
              ...ex.timeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                action: 'Escalated to Formal Audit Case',
                note: reason,
              },
            ],
          };
        }
        return ex;
      })
    );

    // Create an audit case automatically
    createAuditCase(
      targetEx.institutionId,
      targetEx.severity === 'Blocking Error' ? 'Urgent' : 'High',
      `Escalated from ${targetEx.id}: ${targetEx.reason}. Reviewer Note: ${reason}`,
      [targetEx.evidence, `Escalation reason: ${reason}`]
    );

    logAudit('Exception', exceptionId, `Escalated to formal audit case: ${reason}`, 'Flagged');
  };

  const createAuditCase = (
    institutionId: string,
    priority: AuditCase['priority'],
    summary: string,
    evidenceNotes: string[]
  ): AuditCase => {
    const inst = institutions.find((i) => i.id === institutionId);
    const newCaseId = `CASE-2024-${(auditCases.length + 1).toString().padStart(3, '0')}`;
    const newCase: AuditCase = {
      id: newCaseId,
      institutionId,
      institutionName: inst ? inst.name : 'Unknown Institution',
      academicYear: settings.activeAcademicYear,
      relatedExceptionIds: [],
      priority,
      assignedReviewer:
        settings.currentRole === 'AICTE Analyst'
          ? 'Dr. Anita Joshi (AICTE Analyst)'
          : 'V. Sundaram (Regulatory Auditor)',
      dateOpened: new Date().toISOString().slice(0, 10),
      institutionResponseStatus: 'Pending',
      decisionStatus: 'Open',
      summary,
      evidenceNotes,
      institutionResponses: [],
      caseTimeline: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actor: settings.currentRole,
          event: 'Audit Case Opened',
          note: summary,
        },
      ],
      riskScore: inst ? inst.reviewPriorityScore : 50,
    };

    setAuditCases((prev) => [newCase, ...prev]);
    logAudit('Case Management', newCaseId, `Opened new audit case for ${newCase.institutionName}`, 'Success');
    return newCase;
  };

  const updateAuditCaseStatus = (
    caseId: string,
    status: AuditCase['decisionStatus'],
    note?: string
  ) => {
    setAuditCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            decisionStatus: status,
            closingReason: status === 'Cleared' || status === 'Corrected' ? note : c.closingReason,
            caseTimeline: [
              ...c.caseTimeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                event: `Decision Status Updated to ${status}`,
                note,
              },
            ],
          };
        }
        return c;
      })
    );
    logAudit('Case Management', caseId, `Updated case decision to ${status}${note ? `: ${note}` : ''}`, 'Modified');
  };

  const addCaseResponse = (
    caseId: string,
    responder: string,
    statement: string,
    refDoc?: string
  ) => {
    setAuditCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            institutionResponseStatus: 'Received',
            decisionStatus: c.decisionStatus === 'Awaiting Institution Response' ? 'Under Review' : c.decisionStatus,
            institutionResponses: [
              ...c.institutionResponses,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                responder,
                statement,
                referenceDocument: refDoc,
              },
            ],
            caseTimeline: [
              ...c.caseTimeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: 'Institution Administrator',
                event: 'Institutional Response Submitted',
                note: statement,
              },
            ],
          };
        }
        return c;
      })
    );
    logAudit('Case Management', caseId, `Recorded institution reply from ${responder}`, 'Modified');
  };

  const requestCaseClarification = (caseId: string, noticeDetails: string) => {
    setAuditCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          return {
            ...c,
            institutionResponseStatus: 'Clarification Requested',
            decisionStatus: 'Awaiting Institution Response',
            caseTimeline: [
              ...c.caseTimeline,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                actor: settings.currentRole,
                event: 'Clarification Notice Issued',
                note: noticeDetails,
              },
            ],
          };
        }
        return c;
      })
    );
    logAudit('Case Management', caseId, `Issued regulatory clarification notice: ${noticeDetails}`, 'Modified');
  };

  const updateEnrolmentRecord = (
    recordId: string,
    updates: Partial<EnrolmentRecord>,
    justification: string
  ) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const updated: EnrolmentRecord = {
            ...r,
            ...updates,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
            history: [
              ...r.history,
              {
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                action: 'Record Corrected / Updated',
                actor: settings.currentRole,
                details: justification,
              },
            ],
          };
          return updated;
        }
        return r;
      })
    );
    logAudit('Correction', recordId, `Updated enrolment record: ${justification}`, 'Modified');
  };

  const processSubmission = (
    institutionId: string,
    fileName: string,
    rows: Array<Record<string, string>>
  ) => {
    const inst = institutions.find((i) => i.id === institutionId);
    if (!inst) {
      throw new Error('Target institution not found');
    }

    let accepted = 0;
    let rejected = 0;
    let reviewRequired = 0;
    let duplicatesFound = 0;
    const newRecords: EnrolmentRecord[] = [];
    const newExceptions: ValidationException[] = [];

    const receiptNum = `AICTE-RC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const submissionId = `SUB-2024-${(submissions.length + 1).toString().padStart(3, '0')}`;

    rows.forEach((row, idx) => {
      const studentRef = (row['StudentRef'] || row['student_ref'] || `STU-NEW-${idx + 1}`).trim();
      const apaarId = (row['SyntheticApaarId'] || row['apaar_id'] || `DEMO-APAAR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const progCode = (row['ProgrammeCode'] || row['programme_code'] || 'CSE-UG').trim();
      const status = (row['EnrolmentStatus'] || 'Active').trim() as EnrolmentRecord['enrolmentStatus'];

      // Look up programme
      const matchedProg = inst.programmes.find(
        (p) => p.code.toLowerCase() === progCode.toLowerCase() || p.name.toLowerCase().includes(progCode.toLowerCase())
      ) || inst.programmes[0];

      // Check cross-institution duplicate
      const crossDup = records.find(
        (r) => r.syntheticApaarId.toLowerCase() === apaarId.toLowerCase() && r.institutionId !== inst.id
      );

      const isDuplicate = Boolean(crossDup);
      if (isDuplicate) duplicatesFound++;

      let recordStatus: EnrolmentRecord['validationStatus'] = 'Valid';
      let excIndicator: string | undefined = undefined;

      if (isDuplicate) {
        recordStatus = 'Duplicate Candidate';
        excIndicator = `Potential cross-institution conflict with ${crossDup?.institutionName}`;
        reviewRequired++;

        newExceptions.push({
          id: `EXC-${Math.floor(2000 + Math.random() * 8000)}`,
          institutionId: inst.id,
          institutionName: inst.name,
          programmeName: matchedProg ? matchedProg.name : 'Unknown Programme',
          academicYear: settings.activeAcademicYear,
          ruleId: 'RULE-DUPLICATE-ENROLMENT',
          severity: 'Blocking Error',
          reason: `Duplicate synthetic APAAR collision: ${apaarId} concurrently active at ${crossDup?.institutionName}.`,
          detectionTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          assignedReviewer: 'Unassigned',
          status: 'New',
          affectedStudentRef: studentRef,
          affectedApaar: apaarId,
          evidence: `Batch upload ${fileName} flagged concurrent registration against existing database record.`,
          suggestedAction: 'Hold student seat verification pending institutional documentation check.',
          timeline: [
            {
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
              actor: 'Automated Rule Engine',
              action: 'Duplicate Flagged on Ingestion',
            },
          ],
        });
      } else {
        accepted++;
      }

      newRecords.push({
        id: `rec-upload-${Date.now()}-${idx}`,
        studentRef,
        syntheticApaarId: apaarId,
        maskedStudentName: row['StudentName'] || `S*** ${String.fromCharCode(65 + (idx % 26))}***`,
        gender: (row['Gender'] as any) || (idx % 2 === 0 ? 'M' : 'F'),
        category: (row['Category'] as any) || 'General',
        institutionId: inst.id,
        institutionName: inst.name,
        programmeId: matchedProg ? matchedProg.id : 'unknown',
        programmeName: matchedProg ? matchedProg.name : 'General Intake',
        academicYear: settings.activeAcademicYear,
        admissionDate: row['AdmissionDate'] || new Date().toISOString().slice(0, 10),
        enrolmentStatus: status,
        validationStatus: recordStatus,
        exceptionIndicator: excIndicator,
        lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
        corroboration: {
          admissionRecordPresent: true,
          programmeMappingValid: Boolean(matchedProg),
          supportingEvidenceAvailable: true,
          externalAdapterStatus: isDuplicate ? 'Pending Review' : 'Verified in demo',
          evidenceTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          evidenceSource: 'CSV Batch Import (Simulated Adapter)',
          notes: isDuplicate ? 'Pending multi-institution collision clearance' : 'Simulated verification completed',
        },
        history: [
          {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            action: `Imported via ${fileName}`,
            actor: settings.currentRole,
            details: `Batch submission receipt: ${receiptNum}`,
          },
        ],
      });
    });

    // Check intake overrun
    const newTotalReported = inst.reportedEnrolment + accepted;
    if (newTotalReported > inst.approvedIntake) {
      const overrunSeats = newTotalReported - inst.approvedIntake;
      newExceptions.push({
        id: `EXC-${Math.floor(2000 + Math.random() * 8000)}`,
        institutionId: inst.id,
        institutionName: inst.name,
        programmeName: 'Institutional Total Intake',
        academicYear: settings.activeAcademicYear,
        ruleId: 'RULE-INTAKE-EXCEEDED',
        severity: 'Blocking Error',
        reason: `Cumulative reported enrolments (${newTotalReported}) exceed total approved council intake (${inst.approvedIntake}) by ${overrunSeats} seats.`,
        detectionTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        assignedReviewer: 'Unassigned',
        status: 'New',
        evidence: `Batch ${fileName} increased reported enrolment past approved ceiling.`,
        suggestedAction: 'Require institution to provide government quota allotment documentation.',
        timeline: [
          {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            actor: 'Automated Rule Engine',
            action: 'Capacity Overrun Detected',
          },
        ],
      });
    }

    const sub: Submission = {
      id: submissionId,
      institutionId: inst.id,
      institutionName: inst.name,
      academicYear: settings.activeAcademicYear,
      submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      fileName,
      totalRows: rows.length,
      acceptedCount: accepted,
      rejectedCount: rejected,
      reviewRequiredCount: reviewRequired,
      status: newExceptions.length > 0 ? 'Flagged with Exceptions' : 'Validated',
      submittedBy: `${inst.contactPerson} (${settings.currentRole})`,
      receiptNumber: receiptNum,
    };

    setSubmissions((prev) => [sub, ...prev]);
    setRecords((prev) => [...newRecords, ...prev]);
    if (newExceptions.length > 0) {
      setExceptions((prev) => [...newExceptions, ...prev]);
    }

    // Update institution reported enrolment count
    setInstitutions((prev) =>
      prev.map((i) => {
        if (i.id === inst.id) {
          return {
            ...i,
            reportedEnrolment: i.reportedEnrolment + accepted,
            lastSubmissionDate: new Date().toISOString().slice(0, 10),
            submissionStatus: newExceptions.length > 0 ? 'Discrepancy Detected' : 'Submitted',
          };
        }
        return i;
      })
    );

    logAudit(
      'Submission',
      receiptNum,
      `Processed file ${fileName} for ${inst.name} (${accepted} accepted, ${reviewRequired} review-required)`,
      newExceptions.length > 0 ? 'Flagged' : 'Success'
    );

    return {
      submission: sub,
      exceptionsRaised: newExceptions.length,
      duplicateCount: duplicatesFound,
    };
  };

  const value = useMemo(
    () => ({
      institutions,
      records,
      exceptions,
      auditCases,
      submissions,
      auditTrail,
      settings,
      riskOverrides,
      setRole,
      setAcademicYear,
      updateRuleWeights,
      updateTolerance,
      setActiveInstitutionForAdmin,
      resetAllData,
      getInstitutionRisk,
      setInstitutionRiskOverride,
      removeInstitutionRiskOverride,
      resolveException,
      dismissException,
      assignException,
      escalateException,
      createAuditCase,
      updateAuditCaseStatus,
      addCaseResponse,
      requestCaseClarification,
      updateEnrolmentRecord,
      processSubmission,
      logAudit,
    }),
    [institutions, records, exceptions, auditCases, submissions, auditTrail, settings, riskOverrides]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
