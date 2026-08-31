import type { ActivityItem, ActivityType } from "../types";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  RequestWorkerSubmission,
} from "../requests/types";
import { primaryOpenCode } from "./policy";
import type { ResolutionCase, ResolutionProblemCode } from "./types";

function titleForCode(
  code: ResolutionProblemCode | undefined,
  worker: RequestWorkerSubmission,
  request: DocumentRequest | undefined,
): { type: ActivityType; titleHe: string; metadataHe?: string } {
  const name = worker.submittedFullName || "עובד";
  const requestTitle = request?.title ?? "בקשת מסמכים";
  switch (code) {
    case "requested_document_missing":
      return { type: "action", titleHe: `חסר מסמך עבור ${name}`, metadataHe: requestTitle };
    case "wrong_document_for_slot":
      return { type: "action", titleHe: `הועלה קובץ לא מתאים עבור ${name}`, metadataHe: requestTitle };
    case "file_unreadable":
      return { type: "action", titleHe: `מסמך אינו קריא עבור ${name}`, metadataHe: requestTitle };
    case "worker_name_conflict":
    case "worker_identity_conflict":
    case "worker_name_missing":
      return { type: "action", titleHe: `סתירה בפרטי ${name}`, metadataHe: requestTitle };
    case "document_expired":
      return { type: "alert", titleHe: `מסמך פג תוקף עבור ${name}`, metadataHe: requestTitle };
    case "slot_match_uncertain":
    case "field_uncertain":
    case "validity_unknown":
    case "duplicate_within_submission":
    case "unknown":
      return { type: "action", titleHe: `הגשת ${name} דורשת בדיקה`, metadataHe: requestTitle };
    default:
      if (worker.status === "approved") {
        return { type: "update", titleHe: `אושרה הגשת ${name}`, metadataHe: requestTitle };
      }
      if (worker.status === "complete") {
        return { type: "update", titleHe: `כל המסמכים עבור ${name} התקבלו`, metadataHe: requestTitle };
      }
      if (worker.status === "processing" || worker.status === "uploading") {
        return { type: "processing", titleHe: `מעבדים הגשה עבור ${name}`, metadataHe: requestTitle };
      }
      return { type: "update", titleHe: `התקבלה הגשה עבור ${name}`, metadataHe: requestTitle };
  }
}

export function projectWorkerSubmissionToActivity(input: {
  worker: RequestWorkerSubmission;
  request?: DocumentRequest;
  documents: RequestDocumentSubmission[];
  cases: ResolutionCase[];
  previous?: ActivityItem;
  now: Date;
}): ActivityItem | null {
  if (!input.worker.activityId || !input.worker.submittedAt) return null;
  const cases = input.cases.filter(
    (entry) => entry.workerSubmissionId === input.worker.id,
  );
  const investigating = cases.some(
    (entry) => entry.state === "investigating" || entry.state === "resolving",
  );
  const code = investigating ? undefined : primaryOpenCode(cases);
  const copy = titleForCode(
    investigating ? undefined : code,
    investigating ? { ...input.worker, status: "processing" } : input.worker,
    input.request,
  );
  const deferred = cases.some((entry) => entry.deferredAt);
  const resolved =
    (input.worker.status === "complete" || input.worker.status === "approved") &&
    !code;
  const base: ActivityItem = {
    id: input.worker.activityId,
    type: copy.type,
    titleHe: copy.titleHe,
    metadataHe: copy.metadataHe,
    timestamp: input.previous?.timestamp ?? input.now.toISOString(),
    openBehavior: "agentic_sheet",
    requestId: input.worker.requestId,
    workerSubmissionId: input.worker.id,
    caseId: cases[0]?.id,
    sourceFileId: input.documents.find((doc) => doc.sourceFileId)?.sourceFileId,
    deferred,
    resolved,
    resolvedAt: resolved ? input.now.toISOString() : undefined,
    qaScenarioId: input.previous?.qaScenarioId ?? cases[0]?.qaScenarioId,
    qaOrder: input.previous?.qaOrder,
  };
  return input.previous ? { ...input.previous, ...base } : base;
}

export function projectRequestActivity(input: {
  id: string;
  request: DocumentRequest;
  kind: "created" | "opened" | "expiring" | "expired" | "closed";
  now: Date;
  previous?: ActivityItem;
  qaScenarioId?: string;
  qaOrder?: number;
}): ActivityItem {
  const titles: Record<typeof input.kind, { type: ActivityType; titleHe: string }> = {
    created: { type: "update", titleHe: `נוצרה בקשה: ${input.request.title}` },
    opened: { type: "update", titleHe: `המקבל פתח את הקישור: ${input.request.title}` },
    expiring: { type: "alert", titleHe: `הקישור עומד לפוג: ${input.request.title}` },
    expired: { type: "alert", titleHe: `הקישור פג: ${input.request.title}` },
    closed: { type: "update", titleHe: `הבקשה נסגרה: ${input.request.title}` },
  };
  const copy = titles[input.kind];
  const base: ActivityItem = {
    id: input.id,
    type: copy.type,
    titleHe: copy.titleHe,
    metadataHe: input.request.recipient.name,
    timestamp: input.previous?.timestamp ?? input.now.toISOString(),
    openBehavior: "agentic_sheet",
    requestId: input.request.id,
    resolved: input.kind === "created" || input.kind === "opened" || input.kind === "closed",
    qaScenarioId: input.qaScenarioId,
    qaOrder: input.qaOrder,
  };
  return input.previous ? { ...input.previous, ...base } : base;
}
