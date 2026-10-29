export type DemoRole = 'AICTE Analyst' | 'Institution Administrator' | 'Regulatory Auditor';

export type AcademicYear = '2024-25' | '2023-24' | '2025-26';

export type EnrolmentStatus = 'Active' | 'Withdrawn' | 'Transferred' | 'Cancelled' | 'Pending Review' | 'Superseded';

export type RecordValidationStatus = 'Valid' | 'Flagged' | 'Pending' | 'Duplicate Candidate';

export type ExceptionSeverity = 'Blocking Error' | 'Warning' | 'Review Required' | 'Informational';

export type ExceptionStatus = 'New' | 'In Review' | 'Resolved' | 'Dismissed' | 'Escalated';

export type CasePriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export type CaseDecisionStatus =
  | 'Open'
  | 'Awaiting Institution Response'
  | 'Under Review'
  | 'Cleared'
  | 'Corrected'
  | 'Escalated';

export type InstitutionResponseStatus = 'Pending' | 'Received' | 'Clarification Requested';

export interface ProgrammeIntake {
  id: string;
  code: string;
  name: string;
  degreeLevel: 'UG' | 'PG' | 'Diploma';
  approvedIntake: number;
  reportedEnrolment: number;
  discrepancy: number; // reported - approved
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  state: string;
  type: 'Government' | 'Private Unaided' | 'University Constituent' | 'Deemed-to-be University';
  approvedProgrammesCount: number;
  academicYear: AcademicYear;
  approvedIntake: number;
  reportedEnrolment: number;
  submissionStatus: 'Submitted' | 'Pending Review' | 'Discrepancy Detected' | 'Late Submission';
  reviewPriorityScore: number;
  riskTier: 'Low' | 'Moderate' | 'High';
  lastSubmissionDate: string;
  contactPerson: string;
  contactEmail: string;
  programmes: ProgrammeIntake[];
}

export interface CorroborationSignal {
  admissionRecordPresent: boolean;
  programmeMappingValid: boolean;
  supportingEvidenceAvailable: boolean;
  externalAdapterStatus: 'Verified in demo' | 'Pending Review' | 'Inconclusive' | 'Unavailable';
  evidenceTimestamp: string;
  evidenceSource: string;
  notes: string;
}

export interface EnrolmentRecordHistoryItem {
  timestamp: string;
  action: string;
  actor: string;
  details: string;
}

export interface EnrolmentRecord {
  id: string;
  studentRef: string; // e.g. STU-2024-8841
  syntheticApaarId: string; // e.g. DEMO-APAAR-7392-1084
  maskedStudentName: string; // e.g. A*** R***
  gender: 'M' | 'F' | 'Other';
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  institutionId: string;
  institutionName: string;
  programmeId: string;
  programmeName: string;
  academicYear: AcademicYear;
  admissionDate: string;
  enrolmentStatus: EnrolmentStatus;
  validationStatus: RecordValidationStatus;
  exceptionIndicator?: string;
  lastUpdated: string;
  corroboration: CorroborationSignal;
  history: EnrolmentRecordHistoryItem[];
}

export interface Submission {
  id: string;
  institutionId: string;
  institutionName: string;
  academicYear: AcademicYear;
  submissionDate: string;
  fileName: string;
  totalRows: number;
  acceptedCount: number;
  rejectedCount: number;
  reviewRequiredCount: number;
  status: 'Validated' | 'Flagged with Exceptions' | 'Processing';
  submittedBy: string;
  receiptNumber: string;
}

export interface ValidationException {
  id: string; // e.g. EXC-1042
  institutionId: string;
  institutionName: string;
  programmeName: string;
  academicYear: AcademicYear;
  ruleId:
    | 'RULE-INTAKE-EXCEEDED'
    | 'RULE-DUPLICATE-ENROLMENT'
    | 'RULE-APAAR-MISMATCH'
    | 'RULE-INVALID-PROGRAMME'
    | 'RULE-DATE-ANOMALY'
    | 'RULE-MISSING-MANDATORY';
  severity: ExceptionSeverity;
  reason: string;
  detectionTimestamp: string;
  assignedReviewer: string;
  status: ExceptionStatus;
  affectedStudentRef?: string;
  affectedApaar?: string;
  evidence: string;
  suggestedAction: string;
  resolutionNote?: string;
  dismissalReason?: string;
  timeline: Array<{
    timestamp: string;
    actor: string;
    action: string;
    note?: string;
  }>;
}

export interface RiskIndicatorBreakdown {
  indicatorId: string;
  name: string;
  weight: number; // percentage, e.g. 25
  rawValue: string | number;
  scoreContribution: number;
  threshold: string;
  formula: string;
  explanation: string;
  severity: 'Normal' | 'Elevated' | 'High';
}

export interface InstitutionRiskProfile {
  institutionId: string;
  institutionName: string;
  calculatedScore: number;
  effectiveScore: number;
  overrideScore?: number;
  overrideReason?: string;
  overrideBy?: string;
  overrideTimestamp?: string;
  tier: 'Low' | 'Moderate' | 'High';
  indicators: RiskIndicatorBreakdown[];
  plainExplanation: string;
}

export interface AuditCaseResponse {
  timestamp: string;
  responder: string;
  statement: string;
  referenceDocument?: string;
}

export interface AuditCaseTimelineItem {
  timestamp: string;
  actor: string;
  event: string;
  note?: string;
}

export interface AuditCase {
  id: string; // e.g. CASE-2024-019
  institutionId: string;
  institutionName: string;
  academicYear: AcademicYear;
  relatedExceptionIds: string[];
  priority: CasePriority;
  assignedReviewer: string;
  dateOpened: string;
  institutionResponseStatus: InstitutionResponseStatus;
  decisionStatus: CaseDecisionStatus;
  summary: string;
  evidenceNotes: string[];
  institutionResponses: AuditCaseResponse[];
  caseTimeline: AuditCaseTimelineItem[];
  closingReason?: string;
  riskScore: number;
}

export interface AuditTrailEvent {
  id: string;
  timestamp: string;
  actorRole: DemoRole | 'Automated Rule Engine';
  actorName: string;
  actionCategory:
    | 'Submission'
    | 'Validation'
    | 'Exception'
    | 'Correction'
    | 'Case Management'
    | 'Risk Override'
    | 'Report Export'
    | 'Settings';
  affectedRef: string;
  details: string;
  outcome: 'Success' | 'Flagged' | 'Modified' | 'Closed';
}

export interface RiskRuleWeights {
  intakeOverrun: number;
  duplicateEnrolment: number;
  exceptionDensity: number;
  lateSubmission: number;
  corroborationGap: number;
}

export interface AppSettings {
  currentRole: DemoRole;
  activeAcademicYear: AcademicYear;
  intakeTolerancePercentage: number; // e.g. 0% for strict, 2% for tolerance
  ruleWeights: RiskRuleWeights;
  activeInstitutionIdForAdmin: string; // For Institution Administrator demo role
}
