import { isoDaysFrom, toIsoDate, formatDotDate } from "../dates";
import { copy, documentTypeLabels } from "../copy";
import { HAPPY_PATH_EMPLOYEE_ID, HAPPY_PATH_IDENTITY } from "./seed";
import type {
  ActivityItem,
  DocumentRecord,
  Employee,
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

export function nextStage(stage: UploadStage): UploadStage | null {
  const index = PROCESSING_STAGES.indexOf(stage);
  if (index === -1) return null;
  if (index === PROCESSING_STAGES.length - 1) return "completed";
  return PROCESSING_STAGES[index + 1];
}

export function buildHappyPathExtraction(now = new Date()) {
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

  const assignedDocument: DocumentRecord = {
    id: `doc-${input.job.id}`,
    employeeId: employee.id,
    typeId: extracted.typeId,
    title: extracted.title,
    issuedOn: extracted.issuedOn,
    expiresOn: extracted.expiresOn,
    issuer: extracted.issuer,
    credentialNumber: extracted.credentialNumber,
    permissionsHe: extracted.permissionsHe,
    lifecycle: "active",
    processingStatus: "ready",
    fileMeta: input.job.fileMeta,
    warningDays: 30,
    createdAt: now.toISOString(),
  };

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
