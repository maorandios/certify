import type { ResolutionCase } from "../resolution/types";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  EventListStatus,
  RequestListBadge,
  RequestWorkerSubmission,
  RequestWorkerSubmissionStatus,
  SubmissionPulse,
  SubmissionPulseBucket,
} from "./types";

export const workerStatusLabels: Record<RequestWorkerSubmissionStatus, string> = {
  draft: "טיוטה",
  uploading: "מעלה",
  processing: "בעיבוד",
  needs_review: "דורש בדיקה",
  complete: "הושלם",
  approved: "אושר בבקשה",
  rejected: "נדחה",
};
import { applyRequestExpiry } from "./transitions";

const REVIEW_CODES = new Set([
  "worker_name_missing",
  "worker_name_conflict",
  "worker_identity_conflict",
  "wrong_document_for_slot",
  "slot_match_uncertain",
  "file_unreadable",
  "field_uncertain",
  "validity_unknown",
  "document_expired",
  "duplicate_within_submission",
  "unknown",
]);

export function isSubmittedWorker(worker: RequestWorkerSubmission): boolean {
  return Boolean(worker.submittedAt) && worker.status !== "draft";
}

export function workerOpenIssues(
  worker: RequestWorkerSubmission,
  cases: ResolutionCase[],
) {
  return cases
    .filter((entry) => entry.workerSubmissionId === worker.id)
    .flatMap((entry) => entry.issues.filter((issue) => issue.state === "open"));
}

export function pulseBucketForWorker(
  worker: RequestWorkerSubmission,
  documents: RequestDocumentSubmission[],
  cases: ResolutionCase[],
): SubmissionPulseBucket | null {
  if (!isSubmittedWorker(worker)) return null;
  if (worker.status === "complete" || worker.status === "approved") {
    return "complete";
  }

  const open = workerOpenIssues(worker, cases);
  const hasReviewIssue =
    worker.status === "needs_review" ||
    worker.status === "rejected" ||
    open.some((issue) => REVIEW_CODES.has(issue.code));
  if (hasReviewIssue) return "needs_review";

  const slots = documents.filter((doc) => doc.workerSubmissionId === worker.id);
  const missing = slots.some((doc) => doc.status === "missing");
  const inflight =
    worker.status === "uploading" ||
    worker.status === "processing" ||
    slots.some((doc) => doc.status === "uploaded" || doc.status === "processing");
  if (missing || inflight) return "waiting";
  return "waiting";
}

export function getSubmissionPulse(
  workers: RequestWorkerSubmission[],
  documents: RequestDocumentSubmission[],
  cases: ResolutionCase[],
): SubmissionPulse {
  let needsReview = 0;
  let waiting = 0;
  let complete = 0;
  let submitted = 0;
  for (const worker of workers) {
    const bucket = pulseBucketForWorker(worker, documents, cases);
    if (!bucket) continue;
    submitted += 1;
    if (bucket === "needs_review") needsReview += 1;
    else if (bucket === "waiting") waiting += 1;
    else complete += 1;
  }
  return { needsReview, waiting, complete, submitted };
}

export function requestListBadge(
  request: DocumentRequest,
  now = new Date(),
): RequestListBadge {
  const live = applyRequestExpiry(request, now);
  if (live.status === "revoked") return "revoked";
  if (live.status === "expired") return "expired";
  if (live.status === "closed") return "closed";
  if (!live.openedAt) return "unopened";
  return "active";
}

export function eventListStatus(
  request: DocumentRequest,
  workers: RequestWorkerSubmission[],
  now = new Date(),
): EventListStatus {
  const live = applyRequestExpiry(request, now);
  if (live.status === "revoked") return "cancelled";
  if (live.status === "closed") return "completed";
  const hasSubmitted = workers.some(
    (worker) => worker.requestId === request.id && isSubmittedWorker(worker),
  );
  if (hasSubmitted) return "in_progress";
  return "open";
}

export function requestWorkerCounts(
  requestId: string,
  workers: RequestWorkerSubmission[],
  documents: RequestDocumentSubmission[],
  cases: ResolutionCase[],
) {
  const mine = workers.filter((worker) => worker.requestId === requestId);
  const submitted = mine.filter(isSubmittedWorker);
  const pulse = getSubmissionPulse(submitted, documents, cases);
  return {
    submitted: submitted.length,
    complete: pulse.complete,
    needsReview: pulse.needsReview,
    waiting: pulse.waiting,
  };
}
