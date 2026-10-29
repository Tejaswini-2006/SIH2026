import {
  Institution,
  EnrolmentRecord,
  ValidationException,
  RiskRuleWeights,
  InstitutionRiskProfile,
  RiskIndicatorBreakdown,
} from '../types';

export const DEFAULT_RISK_WEIGHTS: RiskRuleWeights = {
  intakeOverrun: 30,
  duplicateEnrolment: 25,
  exceptionDensity: 20,
  lateSubmission: 15,
  corroborationGap: 10,
};

/**
 * Calculates deterministic risk priority profile for an institution
 * Safeguard: Never labels any institution or student as fraudulent.
 * This is an explainable triaging metric for regulatory review prioritization.
 */
export function calculateInstitutionRisk(
  institution: Institution,
  records: EnrolmentRecord[],
  exceptions: ValidationException[],
  weights: RiskRuleWeights = DEFAULT_RISK_WEIGHTS,
  overrideData?: { score: number; reason: string; by: string; timestamp: string }
): InstitutionRiskProfile {
  const instRecords = records.filter((r) => r.institutionId === institution.id);
  const instExceptions = exceptions.filter((e) => e.institutionId === institution.id && e.status !== 'Dismissed');

  // 1. Intake Overrun Indicator
  let intakeExcess = Math.max(0, institution.reportedEnrolment - institution.approvedIntake);
  let intakePctOver = institution.approvedIntake > 0 ? (intakeExcess / institution.approvedIntake) * 100 : 0;
  
  // Programme level check
  const overEnrolledProgrammes = institution.programmes.filter(
    (p) => p.reportedEnrolment > p.approvedIntake
  );
  const programmeOverrunSum = overEnrolledProgrammes.reduce(
    (acc, p) => acc + (p.reportedEnrolment - p.approvedIntake),
    0
  );

  const effectiveExcess = Math.max(intakeExcess, programmeOverrunSum);
  const intakeScoreFactor = effectiveExcess > 0 ? Math.min(100, (effectiveExcess / 15) * 60 + 40) : 0;
  const intakeContribution = Math.round((intakeScoreFactor * weights.intakeOverrun) / 100);

  const intakeIndicator: RiskIndicatorBreakdown = {
    indicatorId: 'IND-INTAKE',
    name: 'Approved Intake Overrun',
    weight: weights.intakeOverrun,
    rawValue: effectiveExcess > 0 ? `+${effectiveExcess} seats (${intakePctOver.toFixed(1)}% excess)` : 'Within intake limit',
    scoreContribution: intakeContribution,
    threshold: '> 0 excess enrolments over approved council intake',
    formula: 'min(100, (excess_seats / 15) * 60 + 40) * weight%',
    explanation: effectiveExcess > 0
      ? `Institution reports ${effectiveExcess} enrolments across ${overEnrolledProgrammes.length} programme(s) exceeding AICTE approved intake thresholds.`
      : 'All reported admissions are strictly within approved council intake capacity.',
    severity: effectiveExcess > 10 ? 'High' : effectiveExcess > 0 ? 'Elevated' : 'Normal',
  };

  // 2. Cross-Institution Duplicate Candidates
  const duplicateRecords = instRecords.filter((r) => r.validationStatus === 'Duplicate Candidate');
  const duplicateCount = duplicateRecords.length;
  const duplicateScoreFactor = duplicateCount > 0 ? Math.min(100, duplicateCount * 35) : 0;
  const duplicateContribution = Math.round((duplicateScoreFactor * weights.duplicateEnrolment) / 100);

  const duplicateIndicator: RiskIndicatorBreakdown = {
    indicatorId: 'IND-DUPLICATE',
    name: 'Cross-Institution Duplicate Enrolments',
    weight: weights.duplicateEnrolment,
    rawValue: `${duplicateCount} conflicting candidate(s)`,
    scoreContribution: duplicateContribution,
    threshold: '1 or more concurrent active enrolments sharing identifier',
    formula: 'min(100, duplicate_count * 35) * weight%',
    explanation: duplicateCount > 0
      ? `Detected ${duplicateCount} enrolment record(s) where synthetic APAAR identifier appears simultaneously enrolled in another approved institution.`
      : 'Zero concurrent multi-institution enrolment collisions detected.',
    severity: duplicateCount > 1 ? 'High' : duplicateCount === 1 ? 'Elevated' : 'Normal',
  };

  // 3. Exception Density & Severity
  const blockingCount = instExceptions.filter((e) => e.severity === 'Blocking Error').length;
  const warningCount = instExceptions.filter((e) => e.severity === 'Warning' || e.severity === 'Review Required').length;
  const rawExceptionPoints = blockingCount * 25 + warningCount * 10;
  const exceptionScoreFactor = Math.min(100, rawExceptionPoints);
  const exceptionContribution = Math.round((exceptionScoreFactor * weights.exceptionDensity) / 100);

  const exceptionIndicator: RiskIndicatorBreakdown = {
    indicatorId: 'IND-EXCEPTIONS',
    name: 'Validation Exceptions Density',
    weight: weights.exceptionDensity,
    rawValue: `${blockingCount} blocking, ${warningCount} warnings/reviews`,
    scoreContribution: exceptionContribution,
    threshold: 'Blocking errors (25 pts) + Warnings (10 pts)',
    formula: 'min(100, (blocking * 25 + warnings * 10)) * weight%',
    explanation: instExceptions.length > 0
      ? `Active unreviewed exceptions: ${blockingCount} critical blocking violation(s) and ${warningCount} review flag(s).`
      : 'Clean validation run. No unresolved exceptions logged.',
    severity: blockingCount > 0 ? 'High' : warningCount > 2 ? 'Elevated' : 'Normal',
  };

  // 4. Submission Timeliness & Revisions
  const isLate = institution.submissionStatus === 'Late Submission';
  const recentCorrections = instRecords.reduce((acc, r) => acc + (r.history.length > 1 ? 1 : 0), 0);
  const lateFactor = (isLate ? 60 : 0) + Math.min(40, recentCorrections * 10);
  const lateContribution = Math.round((lateFactor * weights.lateSubmission) / 100);

  const lateIndicator: RiskIndicatorBreakdown = {
    indicatorId: 'IND-TIMELINESS',
    name: 'Submission Cadence & Revision Volume',
    weight: weights.lateSubmission,
    rawValue: isLate ? `Late Submission (+${recentCorrections} revisions)` : `${recentCorrections} revision(s)`,
    scoreContribution: lateContribution,
    threshold: 'Submission past deadline (+60 pts), >2 revisions (+10 pts each)',
    formula: '(late_flag ? 60 : 0 + min(40, revisions * 10)) * weight%',
    explanation: isLate
      ? 'Institution submitted records past the mandated portal cut-off window, with multiple retroactive batch revisions.'
      : recentCorrections > 2
      ? `Normal submission window observed, but ${recentCorrections} post-submission record corrections detected.`
      : 'Timely initial data submission with minimal retroactive adjustments.',
    severity: isLate ? 'Elevated' : 'Normal',
  };

  // 5. Corroboration Gaps
  const unverifiedRecords = instRecords.filter(
    (r) => r.corroboration.externalAdapterStatus === 'Inconclusive' || r.corroboration.externalAdapterStatus === 'Unavailable'
  );
  const corroborationGapCount = unverifiedRecords.length;
  const corroborationScoreFactor = instRecords.length > 0 ? Math.min(100, (corroborationGapCount / instRecords.length) * 150) : 0;
  const corroborationContribution = Math.round((corroborationScoreFactor * weights.corroborationGap) / 100);

  const corroborationIndicator: RiskIndicatorBreakdown = {
    indicatorId: 'IND-CORROBORATION',
    name: 'Simulated Corroboration Gaps',
    weight: weights.corroborationGap,
    rawValue: `${corroborationGapCount} uncorroborated records (${((corroborationGapCount / Math.max(1, instRecords.length)) * 100).toFixed(0)}%)`,
    scoreContribution: corroborationContribution,
    threshold: 'Missing external simulated corroboration adapter signal',
    formula: 'min(100, (gap_records / total) * 150) * weight%',
    explanation: corroborationGapCount > 0
      ? `${corroborationGapCount} record(s) pending institutional supporting evidence or external mock adapter sync.`
      : 'All submitted records present complete simulated institutional admission evidence.',
    severity: corroborationGapCount > 5 ? 'Elevated' : 'Normal',
  };

  const indicators = [intakeIndicator, duplicateIndicator, exceptionIndicator, lateIndicator, corroborationIndicator];
  const calculatedTotal = indicators.reduce((acc, ind) => acc + ind.scoreContribution, 0);
  const calculatedScore = Math.min(100, Math.max(0, calculatedTotal));

  const effectiveScore = overrideData ? overrideData.score : calculatedScore;

  let tier: 'Low' | 'Moderate' | 'High' = 'Low';
  if (effectiveScore >= 70) {
    tier = 'High';
  } else if (effectiveScore >= 40) {
    tier = 'Moderate';
  }

  // Plain-language summary
  let plainExplanation = '';
  if (tier === 'High') {
    plainExplanation = `High review priority (Score: ${effectiveScore}/100). Priority review advised primarily due to ${
      intakeContribution > 15 ? 'approved intake overrun, ' : ''
    }${duplicateContribution > 10 ? 'cross-institution duplicate candidate collisions, ' : ''}${
      exceptionContribution > 10 ? 'active blocking validation errors.' : 'cumulative validation risks.'
    } This flag is a triage tool for council examiners and does not constitute a finding of misconduct.`;
  } else if (tier === 'Moderate') {
    plainExplanation = `Moderate review priority (Score: ${effectiveScore}/100). Institution exhibits moderate variance in reported intake or advisory warnings. Recommend routine sample verification during the current audit cycle.`;
  } else {
    plainExplanation = `Low review priority (Score: ${effectiveScore}/100). Reported admissions align with council-sanctioned seats; zero duplicate conflicts and nominal validation health.`;
  }

  return {
    institutionId: institution.id,
    institutionName: institution.name,
    calculatedScore,
    effectiveScore,
    overrideScore: overrideData?.score,
    overrideReason: overrideData?.reason,
    overrideBy: overrideData?.by,
    overrideTimestamp: overrideData?.timestamp,
    tier,
    indicators,
    plainExplanation,
  };
}

/**
 * Validate an individual row from a CSV upload
 */
export interface RowValidationResult {
  rowNumber: number;
  data: Record<string, string>;
  status: 'Accepted' | 'Review Required' | 'Rejected';
  errors: string[];
  warnings: string[];
}

export function validateCsvRow(
  row: Record<string, string>,
  rowNumber: number,
  existingRecords: EnrolmentRecord[],
  institution: Institution
): RowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const studentRef = (row['StudentRef'] || row['student_ref'] || '').trim();
  const apaarId = (row['SyntheticApaarId'] || row['apaar_id'] || row['APAAR'] || '').trim();
  const programmeCode = (row['ProgrammeCode'] || row['programme_code'] || '').trim();
  const admissionDate = (row['AdmissionDate'] || row['admission_date'] || '').trim();
  const enrolmentStatus = (row['EnrolmentStatus'] || row['status'] || 'Active').trim();

  // 1. Mandatory values
  if (!studentRef) {
    errors.push('Missing mandatory student reference identifier');
  }
  if (!apaarId) {
    errors.push('Missing synthetic APAAR identifier');
  } else if (!/^DEMO-APAAR-\d{4}-\d{4}$/i.test(apaarId) && !/^APAAR-\d+/i.test(apaarId)) {
    warnings.push('Identifier does not follow standard DEMO-APAAR-XXXX-XXXX test format');
  }

  // 2. Programme check
  const matchedProg = institution.programmes.find(
    (p) => p.code.toLowerCase() === programmeCode.toLowerCase() || p.name.toLowerCase().includes(programmeCode.toLowerCase())
  );
  if (!programmeCode) {
    errors.push('Missing programme code');
  } else if (!matchedProg) {
    errors.push(`Programme code "${programmeCode}" is not in institution's AICTE approved list`);
  }

  // 3. Admission date format check
  if (!admissionDate) {
    warnings.push('Admission date omitted; defaulted to current academic year intake');
  } else if (isNaN(Date.parse(admissionDate))) {
    errors.push('Admission date format is invalid. Expected YYYY-MM-DD');
  }

  // 4. Duplicate APAAR check against other institutions
  if (apaarId) {
    const crossCollision = existingRecords.find(
      (r) => r.syntheticApaarId.toLowerCase() === apaarId.toLowerCase() && r.institutionId !== institution.id
    );
    if (crossCollision) {
      warnings.push(`Potential cross-institution conflict: Identical identifier found at ${crossCollision.institutionName}`);
    }

    const intraCollision = existingRecords.find(
      (r) => r.syntheticApaarId.toLowerCase() === apaarId.toLowerCase() && r.institutionId === institution.id
    );
    if (intraCollision) {
      errors.push(`Duplicate record: Identifier already enrolled in programme ${intraCollision.programmeName}`);
    }
  }

  // 5. Intake limit check preview
  if (matchedProg) {
    if (matchedProg.reportedEnrolment >= matchedProg.approvedIntake) {
      warnings.push(`Programme ${matchedProg.code} is currently at or above approved intake (${matchedProg.approvedIntake} seats)`);
    }
  }

  let status: 'Accepted' | 'Review Required' | 'Rejected' = 'Accepted';
  if (errors.length > 0) {
    status = 'Rejected';
  } else if (warnings.length > 0) {
    status = 'Review Required';
  }

  return {
    rowNumber,
    data: row,
    status,
    errors,
    warnings,
  };
}

/**
 * Dev-only assertion function checking that all counts reconcile across datasets.
 * Logs any mismatches to the console.
 */
export function assertDataConsistency(
  institutions: Institution[],
  records: EnrolmentRecord[],
  exceptions: ValidationException[],
  auditCases: any[]
): boolean {
  let isConsistent = true;

  // 1. Check record validation counts
  const validCount = records.filter((r) => r.validationStatus === 'Valid').length;
  const reviewCount = records.filter(
    (r) => r.validationStatus === 'Flagged' || r.validationStatus === 'Duplicate Candidate' || r.validationStatus === 'Pending'
  ).length;
  const totalReconciled = validCount + reviewCount;

  if (totalReconciled !== records.length) {
    console.warn(
      `[AERVIS Consistency Check] Record validation sum mismatch: Valid (${validCount}) + Review (${reviewCount}) = ${totalReconciled} vs Total (${records.length})`
    );
    isConsistent = false;
  }

  // 2. Check unique states count
  const uniqueStates = new Set(institutions.map((i) => i.state)).size;
  if (uniqueStates !== institutions.length) {
    console.info(
      `[AERVIS Consistency Check] ${institutions.length} institutions across ${uniqueStates} unique states.`
    );
  }

  // 3. Exception counts
  const blocking = exceptions.filter((e) => e.severity === 'Blocking Error').length;
  const warning = exceptions.filter((e) => e.severity === 'Warning').length;
  const reviewReq = exceptions.filter((e) => e.severity === 'Review Required').length;
  const info = exceptions.filter((e) => e.severity === 'Informational').length;
  const sumExceptions = blocking + warning + reviewReq + info;

  if (sumExceptions !== exceptions.length) {
    console.warn(
      `[AERVIS Consistency Check] Exception severity mismatch: sum ${sumExceptions} vs total ${exceptions.length}`
    );
    isConsistent = false;
  }

  if (isConsistent) {
    console.info(
      `[AERVIS Consistency Check Passed] All ${institutions.length} institutions, ${records.length} sample records, and ${exceptions.length} exceptions reconcile perfectly.`
    );
  }

  return isConsistent;
}

