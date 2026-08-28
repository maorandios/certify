import { isoDaysFrom, toIsoDate, formatDotDate } from "../dates";
import { copy, documentTypeLabels } from "../copy";
import { HAPPY_PATH_EMPLOYEE_ID, HAPPY_PATH_IDENTITY } from "./seed";
import type {
  ActivityItem,
  DocumentRecord,
  Employee,
  ExtractedFields,
  MockUploadOutcome,
  UploadJob,
  UploadStage,
} from "../types";

export const PROCESSING_STAGES: UploadStage[] = [
  "reading",
  "identifying",
  "extracting",
  "matching",
];

export const STAGE_DURATION_MS = 900;

export type HappyPathResult = {
  documents: DocumentRecord[];
  activity: ActivityItem[];
  job: UploadJob;
  toastHe: string;
  replaced: boolean;
};

export type OutcomeResult = {
  documents: DocumentRecord[];
  activity: ActivityItem[];
  job: UploadJob;
  toastHe: string | null;
};

export function nextStage(stage: UploadStage): UploadStage | null {
  const index = PROCESSING_STAGES.indexOf(stage);
  if (index === -1) return null;
  if (index === PROCESSING_STAGES.length - 1) return "completed";
  return PROCESSING_STAGES[index + 1];
}

export function buildHappyPathExtraction(now = new Date()): ExtractedFields {
  return {
    fullName: "יוסף לוי",
    identityNumber: HAPPY_PATH_IDENTITY,
    typeId: "height_work" as const,
    title: documentTypeLabels.height_work,
    issuedOn: toIsoDate(now),
    expiresOn: isoDaysFrom(now, 365),
    issuer: "מכון הבטיחות",
    credentialNumber: `HW-${now.getTime().toString().slice(-6)}`,
    permissionsHe: ["עבודה בגובה מעל 2 מ׳"],
  };
}

function documentFromExtraction(input: {
  job: UploadJob;
  extracted: ExtractedFields;
  employeeId: string;
  lifecycle: DocumentRecord["lifecycle"];
  now: Date;
  idSuffix?: string;
}): DocumentRecord {
  const { job, extracted, employeeId, lifecycle, now } = input;
  const uncertain = extracted.uncertainFieldKeys ?? [];
  return {
    id: `doc-${job.id}${input.idSuffix ?? ""}`,
    employeeId,
    typeId: extracted.typeId,
    title: extracted.title,
    issuedOn: extracted.issuedOn,
    validFrom: extracted.validFrom,
    expiresOn: extracted.expiresOn,
    issuer: extracted.issuer,
    credentialNumber: extracted.credentialNumber,
    permissionsHe: extracted.permissionsHe,
    restrictionsHe: extracted.restrictionsHe,
    lifecycle,
    processingStatus: uncertain.length > 0 ? "uncertain" : "ready",
    uncertainFieldKeys: uncertain.length > 0 ? uncertain : undefined,
    fileMeta: job.fileMeta,
    warningDays: 30,
    createdAt: now.toISOString(),
  };
}

export function applyHappyPathAssignment(input: {
  employees: Employee[];
  documents: DocumentRecord[];
  job: UploadJob;
  now?: Date;
}): HappyPathResult {
  const now = input.now ?? new Date();
  const extracted = input.job.extracted ?? buildHappyPathExtraction(now);
  const employee =
    input.employees.find((item) => item.id === HAPPY_PATH_EMPLOYEE_ID) ??
    input.employees.find(
      (item) => item.identityNumber === extracted.identityNumber,
    );

  if (!employee) {
    throw new Error("Happy-path employee is missing from mock state");
  }

  const previous = input.documents.find(
    (document) =>
      document.employeeId === employee.id &&
      document.typeId === extracted.typeId &&
      document.lifecycle === "active",
  );

  const documents = input.documents.map((document) =>
    document.id === previous?.id
      ? { ...document, lifecycle: "superseded" as const }
      : document,
  );

  const assignedDocument = documentFromExtraction({
    job: input.job,
    extracted,
    employeeId: employee.id,
    lifecycle: "active",
    now,
  });

  documents.push(assignedDocument);

  const replaced = Boolean(previous);
  const activityItem: ActivityItem = {
    id: `act-${input.job.id}`,
    type: "update",
    titleHe: replaced
      ? copy.replacedFeedTitle
      : copy.assignedFeedTitle(extracted.title),
    employeeId: employee.id,
    documentId: assignedDocument.id,
    jobId: input.job.id,
    timestamp: now.toISOString(),
    metadataHe: assignedDocument.expiresOn
      ? `${extracted.title} · בתוקף עד ${formatDotDate(assignedDocument.expiresOn)}`
      : extracted.title,
  };

  return {
    documents,
    activity: [activityItem],
    replaced,
    toastHe: replaced
      ? copy.replacedToast(employee.fullName)
      : copy.assignedToast(extracted.title, employee.fullName),
    job: {
      ...input.job,
      stage: "completed",
      extracted,
      assignedEmployeeId: employee.id,
      assignedDocumentId: assignedDocument.id,
      replacedDocumentId: previous?.id,
      updatedAt: now.toISOString(),
    },
  };
}

/**
 * Extraction fixtures per simulated outcome. Each returns realistic mock
 * data that drives the matching decision the UI must present.
 */
export function buildExtractionForOutcome(
  outcome: MockUploadOutcome,
  now = new Date(),
): ExtractedFields | undefined {
  switch (outcome) {
    case "certain_match":
      return buildHappyPathExtraction(now);
    case "employee_not_found":
      return {
        fullName: "כרים עבאס",
        identityNumber: "512778401",
        typeId: "safety",
        title: documentTypeLabels.safety,
        issuedOn: toIsoDate(now),
        expiresOn: isoDaysFrom(now, 365),
        issuer: "קצין הבטיחות באתר",
        credentialNumber: `SF-${now.getTime().toString().slice(-4)}`,
      };
    case "ambiguous_employee":
      return {
        fullName: "י. לוי",
        identityNumber: "…8341 (חלקי)",
        typeId: "equipment",
        title: documentTypeLabels.equipment,
        issuedOn: toIsoDate(now),
        expiresOn: isoDaysFrom(now, 180),
        issuer: "מוסך הציוד",
        credentialNumber: `EQ-${now.getTime().toString().slice(-3)}`,
        uncertainFieldKeys: ["fullName", "identityNumber"],
      };
    case "uncertain_field":
      return {
        fullName: "ויקטור פטרנקו",
        identityNumber: "887120334",
        typeId: "medical",
        title: documentTypeLabels.medical,
        issuedOn: toIsoDate(now),
        issuer: "קופת חולים",
        credentialNumber: `MD-${now.getTime().toString().slice(-3)}`,
        uncertainFieldKeys: ["expiresOn"],
      };
    case "unreadable_file":
      return undefined;
    case "exact_duplicate":
      return {
        fullName: "אחמד ח'ליל",
        identityNumber: "401228763",
        typeId: "safety",
        title: documentTypeLabels.safety,
        issuedOn: isoDaysFrom(now, -20),
        expiresOn: isoDaysFrom(now, 345),
        issuer: "קצין הבטיחות באתר",
        credentialNumber: "SF-4410",
      };
    case "possible_duplicate":
      return {
        fullName: "נתן ברק",
        identityNumber: "203441778",
        typeId: "safety",
        title: documentTypeLabels.safety,
        issuedOn: isoDaysFrom(now, -14),
        expiresOn: isoDaysFrom(now, 351),
        issuer: "קצין הבטיחות באתר",
        credentialNumber: "SF-88__ (חלקי)",
        uncertainFieldKeys: ["credentialNumber"],
      };
    case "certain_replacement":
      return {
        fullName: "מריה סנטוס",
        identityNumber: "990441228",
        typeId: "operator",
        title: documentTypeLabels.operator,
        issuedOn: toIsoDate(now),
        expiresOn: isoDaysFrom(now, 365),
        issuer: "מכון ההדרכה",
        credentialNumber: `OP-${now.getTime().toString().slice(-4)}`,
        permissionsHe: ["במת הרמה", "פיגום ממוכן"],
      };
    case "uncertain_replacement":
      return {
        fullName: "מוחמד יוסף",
        identityNumber: "318445902",
        typeId: "height_work",
        title: documentTypeLabels.height_work,
        issuedOn: toIsoDate(now),
        expiresOn: isoDaysFrom(now, 365),
        issuer: "מכון בטיחות אחר",
        credentialNumber: `HW-${now.getTime().toString().slice(-5)}`,
        uncertainFieldKeys: ["typeId"],
      };
  }
}

function actionRequiredJob(job: UploadJob, now: Date): UploadJob {
  return { ...job, stage: "action_required", updatedAt: now.toISOString() };
}

/**
 * Applies a simulated processing outcome when a job finishes its stages.
 * Pure: returns the next documents array, new activity items and the
 * updated job, leaving persistence to the store.
 */
export function applyUploadOutcome(input: {
  employees: Employee[];
  documents: DocumentRecord[];
  job: UploadJob;
  outcome: MockUploadOutcome;
  now?: Date;
}): OutcomeResult {
  const now = input.now ?? new Date();
  const { employees, documents, job, outcome } = input;
  const extracted = buildExtractionForOutcome(outcome, now);
  const stamped = { ...job, outcome, extracted, updatedAt: now.toISOString() };

  switch (outcome) {
    case "certain_match": {
      const result = applyHappyPathAssignment({
        employees,
        documents,
        job: { ...job, extracted: job.extracted ?? extracted },
        now,
      });
      return {
        documents: result.documents,
        activity: result.activity,
        job: { ...result.job, outcome },
        toastHe: result.toastHe,
      };
    }

    case "employee_not_found": {
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "action",
        titleHe: `זיהינו מסמך של ${extracted?.fullName} אבל אין עובד כזה בתיק`,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted?.title,
        evidenceHe: `שם: ${extracted?.fullName} · מספר מזהה: ${extracted?.identityNumber}`,
        action: { labelHe: copy.createNewEmployeeAction, kind: "create_employee" },
      };
      return {
        documents,
        activity: [item],
        job: actionRequiredJob(stamped, now),
        toastHe: "המסמך מחכה לשיוך לעובד חדש",
      };
    }

    case "ambiguous_employee": {
      const candidates = employees
        .filter((employee) => employee.fullName.includes("לוי"))
        .map((employee) => employee.id)
        .slice(0, 3);
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "action",
        titleHe: "מצאנו כמה עובדים שמתאימים למסמך — צריך לבחור למי לשייך",
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted?.title,
        evidenceHe: `שם על המסמך: ${extracted?.fullName} · מספר מזהה: ${extracted?.identityNumber}`,
        candidateEmployeeIds: candidates,
        action: { labelHe: "בחירת עובד", kind: "select_employee" },
      };
      return {
        documents,
        activity: [item],
        job: actionRequiredJob(stamped, now),
        toastHe: "צריך לבחור למי לשייך את המסמך",
      };
    }

    case "uncertain_field": {
      const employee = employees.find(
        (candidate) => candidate.identityNumber === extracted?.identityNumber,
      );
      if (!employee || !extracted) {
        return failUnreadable(documents, stamped, now);
      }
      const pending = documentFromExtraction({
        job,
        extracted,
        employeeId: employee.id,
        lifecycle: "needs_review",
        now,
      });
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "action",
        titleHe: `שייכנו ${extracted.title} ל${employee.fullName} אבל תאריך התוקף לא ברור`,
        employeeId: employee.id,
        documentId: pending.id,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted.title,
        fieldKey: "expiresOn",
        evidenceHe: "בתוקף עד: לא אותר בסריקה",
        action: { labelHe: "בדיקת התאריך", kind: "confirm_field" },
      };
      return {
        documents: [...documents, pending],
        activity: [item],
        job: {
          ...actionRequiredJob(stamped, now),
          assignedEmployeeId: employee.id,
          assignedDocumentId: pending.id,
        },
        toastHe: `המסמך של ${employee.fullName} מחכה לבדיקה קצרה`,
      };
    }

    case "unreadable_file":
      return failUnreadable(documents, stamped, now);

    case "exact_duplicate": {
      const existing = documents.find(
        (document) =>
          document.credentialNumber === extracted?.credentialNumber &&
          document.lifecycle === "active",
      );
      const employee = employees.find(
        (candidate) => candidate.id === existing?.employeeId,
      );
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "update",
        titleHe: `המסמך שהועלה כבר קיים בתיק של ${employee?.fullName ?? "העובד"} ולא נשמר שוב`,
        employeeId: existing?.employeeId,
        documentId: existing?.id,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted?.title,
      };
      return {
        documents,
        activity: [item],
        job: {
          ...stamped,
          stage: "completed",
          assignedEmployeeId: existing?.employeeId,
          assignedDocumentId: existing?.id,
        },
        toastHe: "המסמך כבר קיים במערכת — לא נשמר כפול",
      };
    }

    case "possible_duplicate": {
      const employee = employees.find(
        (candidate) => candidate.identityNumber === extracted?.identityNumber,
      );
      const existing = documents.find(
        (document) =>
          document.employeeId === employee?.id &&
          document.typeId === extracted?.typeId &&
          document.lifecycle === "active",
      );
      if (!employee || !existing || !extracted) {
        return failUnreadable(documents, stamped, now);
      }
      const pending = documentFromExtraction({
        job,
        extracted,
        employeeId: employee.id,
        lifecycle: "needs_review",
        now,
      });
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "action",
        titleHe: `המסמך החדש של ${employee.fullName} נראה דומה מאוד למסמך קיים — כפילות?`,
        employeeId: employee.id,
        documentId: existing.id,
        pendingDocumentId: pending.id,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted.title,
        evidenceHe: `מספר תעודה במסמך החדש: ${extracted.credentialNumber} · במסמך הקיים: ${existing.credentialNumber}`,
        action: { labelHe: "החלטה על כפילות", kind: "confirm_replacement" },
      };
      return {
        documents: [...documents, pending],
        activity: [item],
        job: {
          ...actionRequiredJob(stamped, now),
          assignedEmployeeId: employee.id,
          assignedDocumentId: pending.id,
        },
        toastHe: "ייתכן שהמסמך כבר קיים — צריך החלטה שלך",
      };
    }

    case "certain_replacement": {
      const employee = employees.find(
        (candidate) => candidate.identityNumber === extracted?.identityNumber,
      );
      if (!employee || !extracted) {
        return failUnreadable(documents, stamped, now);
      }
      const previous = documents.find(
        (document) =>
          document.employeeId === employee.id &&
          document.typeId === extracted.typeId &&
          document.lifecycle === "active",
      );
      const nextDocuments = documents.map((document) =>
        document.id === previous?.id
          ? { ...document, lifecycle: "superseded" as const }
          : document,
      );
      const fresh = documentFromExtraction({
        job,
        extracted,
        employeeId: employee.id,
        lifecycle: "active",
        now,
      });
      nextDocuments.push(fresh);
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "update",
        titleHe: copy.replacedFeedTitle,
        employeeId: employee.id,
        documentId: fresh.id,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: fresh.expiresOn
          ? `${extracted.title} · בתוקף עד ${formatDotDate(fresh.expiresOn)}`
          : extracted.title,
      };
      return {
        documents: nextDocuments,
        activity: [item],
        job: {
          ...stamped,
          stage: "completed",
          assignedEmployeeId: employee.id,
          assignedDocumentId: fresh.id,
          replacedDocumentId: previous?.id,
        },
        toastHe: copy.replacedToast(employee.fullName),
      };
    }

    case "uncertain_replacement": {
      const employee = employees.find(
        (candidate) => candidate.identityNumber === extracted?.identityNumber,
      );
      const existing = documents.find(
        (document) =>
          document.employeeId === employee?.id &&
          document.typeId === extracted?.typeId &&
          document.lifecycle === "active",
      );
      if (!employee || !existing || !extracted) {
        return failUnreadable(documents, stamped, now);
      }
      const pending = documentFromExtraction({
        job,
        extracted,
        employeeId: employee.id,
        lifecycle: "needs_review",
        now,
      });
      const item: ActivityItem = {
        id: `act-${job.id}`,
        type: "action",
        titleHe: `התקבל ${extracted.title} חדש ל${employee.fullName} — האם הוא מחליף את הקודם?`,
        employeeId: employee.id,
        documentId: existing.id,
        pendingDocumentId: pending.id,
        jobId: job.id,
        timestamp: now.toISOString(),
        metadataHe: extracted.title,
        evidenceHe: `המסמך החדש מגוף מנפיק אחר (${extracted.issuer}) ולא ברור אם הוא מחליף את הקיים`,
        action: { labelHe: "החלטה על החלפה", kind: "confirm_replacement" },
      };
      return {
        documents: [...documents, pending],
        activity: [item],
        job: {
          ...actionRequiredJob(stamped, now),
          assignedEmployeeId: employee.id,
          assignedDocumentId: pending.id,
        },
        toastHe: "צריך להחליט אם המסמך החדש מחליף את הקודם",
      };
    }
  }
}

function failUnreadable(
  documents: DocumentRecord[],
  job: UploadJob,
  now: Date,
): OutcomeResult {
  const item: ActivityItem = {
    id: `act-${job.id}`,
    type: "action",
    titleHe: "לא הצלחנו לקרוא את הקובץ שהועלה — כדאי לצלם שוב באור טוב יותר",
    jobId: job.id,
    timestamp: now.toISOString(),
    metadataHe: job.fileMeta.name,
    action: { labelHe: copy.replaceFileAction, kind: "replace_file" },
  };
  return {
    documents,
    activity: [item],
    job: { ...job, stage: "failed", updatedAt: now.toISOString() },
    toastHe: "הקובץ לא נקרא — אפשר לנסות קובץ ברור יותר",
  };
}

/**
 * Direct assignment for uploads that already know their employee
 * (upload from employee details, or a public document-request upload).
 */
export function applyTargetedAssignment(input: {
  employees: Employee[];
  documents: DocumentRecord[];
  job: UploadJob;
  target: {
    employeeId: string;
    typeId?: DocumentRecord["typeId"];
    replacesDocumentId?: string;
  };
  now?: Date;
}): OutcomeResult {
  const now = input.now ?? new Date();
  const employee = input.employees.find(
    (candidate) => candidate.id === input.target.employeeId,
  );
  if (!employee) {
    return failUnreadable(input.documents, input.job, now);
  }

  const replaced = input.documents.find(
    (document) => document.id === input.target.replacesDocumentId,
  );
  const typeId = input.target.typeId ?? replaced?.typeId ?? "safety";
  const extracted: ExtractedFields = {
    fullName: employee.fullName,
    identityNumber: employee.identityNumber,
    typeId,
    title: documentTypeLabels[typeId],
    issuedOn: toIsoDate(now),
    expiresOn: isoDaysFrom(now, 365),
    issuer: replaced?.issuer ?? "גוף מנפיק",
    credentialNumber: `${typeId.slice(0, 2).toUpperCase()}-${now
      .getTime()
      .toString()
      .slice(-5)}`,
    permissionsHe: replaced?.permissionsHe,
  };

  const nextDocuments = input.documents.map((document) =>
    document.id === replaced?.id && document.lifecycle === "active"
      ? { ...document, lifecycle: "superseded" as const }
      : document,
  );
  const fresh = documentFromExtraction({
    job: input.job,
    extracted,
    employeeId: employee.id,
    lifecycle: "active",
    now,
  });
  nextDocuments.push(fresh);

  const item: ActivityItem = {
    id: `act-${input.job.id}`,
    type: "update",
    titleHe: replaced
      ? copy.replacedFeedTitle
      : copy.assignedFeedTitle(extracted.title),
    employeeId: employee.id,
    documentId: fresh.id,
    jobId: input.job.id,
    timestamp: now.toISOString(),
    metadataHe: fresh.expiresOn
      ? `${extracted.title} · בתוקף עד ${formatDotDate(fresh.expiresOn)}`
      : extracted.title,
  };

  return {
    documents: nextDocuments,
    activity: [item],
    job: {
      ...input.job,
      stage: "completed",
      extracted,
      assignedEmployeeId: employee.id,
      assignedDocumentId: fresh.id,
      replacedDocumentId: replaced?.id,
      updatedAt: now.toISOString(),
    },
    toastHe: replaced
      ? copy.replacedToast(employee.fullName)
      : copy.assignedToast(extracted.title, employee.fullName),
  };
}
