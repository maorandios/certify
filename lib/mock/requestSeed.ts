import { addDays } from "../dates";
import { buildRequestMessageHe } from "../requests/message";
import { projectRequestActivity } from "../resolution/projection";
import type { ResolutionWorld } from "../resolution/engine";
import type { ActivityItem } from "../types";
import type {
  DocumentRequest,
  RequestedDocument,
  RequestDocumentSubmission,
  RequestWorkerSubmission,
} from "../requests/types";

export type RequestSeed = ResolutionWorld & {
  seedAnchor: string;
};

function slots(
  requestId: string,
  labels: string[],
): RequestedDocument[] {
  return labels.map((label, index) => ({
    id: `slot-${requestId}-${index + 1}`,
    requestId,
    label,
    sortOrder: index,
  }));
}

function request(input: {
  id: string;
  title: string;
  recipient: DocumentRequest["recipient"];
  labels: string[];
  expiresAt: string;
  createdAt: string;
  status?: DocumentRequest["status"];
  openedAt?: string;
  closedAt?: string;
  revokedAt?: string;
}): DocumentRequest {
  const requestedDocuments = slots(input.id, input.labels);
  const token = `r-${input.id.replace(/^req-/, "")}ab12cd34ef56`;
  return {
    id: input.id,
    title: input.title,
    recipient: input.recipient,
    requestedDocuments,
    expiresAt: input.expiresAt,
    status: input.status ?? "active",
    token,
    createdAt: input.createdAt,
    openedAt: input.openedAt,
    closedAt: input.closedAt,
    revokedAt: input.revokedAt,
    messageHe: buildRequestMessageHe({
      title: input.title,
      recipientName: input.recipient.name,
      documents: requestedDocuments,
      url: `/r/${token}`,
    }),
  };
}

function missingDocs(
  request: DocumentRequest,
  workerId: string,
): RequestDocumentSubmission[] {
  return request.requestedDocuments.map((slot) => ({
    id: `dsub-${workerId}-${slot.sortOrder + 1}`,
    requestId: request.id,
    workerSubmissionId: workerId,
    requestedDocumentId: slot.id,
    status: "missing",
  }));
}

export function createRequestSeed(now = new Date()): RequestSeed {
  const created = addDays(now, -3).toISOString();
  const opened = addDays(now, -2).toISOString();

  const unopened = request({
    id: "req-unopened",
    title: "צוות חשמל – אתר רעננה",
    recipient: { name: "דניאל כהן", phone: "0500000000", email: "daniel@example.com" },
    labels: ["צילום תעודת זהות", "אישור עבודה בגובה", "רישיון חשמלאי"],
    expiresAt: addDays(now, 14).toISOString(),
    createdAt: created,
  });

  const openedEmpty = request({
    id: "req-opened",
    title: "קבלן מיזוג – הרצליה",
    recipient: { name: "רותם לוי", phone: "0521111111" },
    labels: ["אישור עבודה בגובה", "הדרכת בטיחות"],
    expiresAt: addDays(now, 10).toISOString(),
    createdAt: created,
    openedAt: opened,
  });

  const multi = request({
    id: "req-multi",
    title: "שיפוץ משרדים – תל אביב",
    recipient: { name: "נועה ברק", email: "noa@example.com" },
    labels: ["צילום תעודת זהות", "אישור עבודה בגובה"],
    expiresAt: addDays(now, 21).toISOString(),
    createdAt: created,
    openedAt: opened,
  });

  const expiring = request({
    id: "req-expiring",
    title: "אתר בנייה – נתניה",
    recipient: { name: "אייל מזרחי", phone: "0542222222" },
    labels: ["הדרכת בטיחות"],
    expiresAt: addDays(now, 0.4).toISOString(),
    createdAt: created,
    openedAt: opened,
  });

  const expired = request({
    id: "req-expired",
    title: "עבודות גמר – חיפה",
    recipient: { name: "שירה כץ", email: "shira@example.com" },
    labels: ["רישיון מקצועי"],
    expiresAt: addDays(now, -2).toISOString(),
    createdAt: addDays(now, -20).toISOString(),
    openedAt: addDays(now, -18).toISOString(),
    status: "expired",
  });

  const closed = request({
    id: "req-closed",
    title: "תחזוקה שוטפת – פתח תקווה",
    recipient: { name: "יוסי אברהם", phone: "0503333333" },
    labels: ["אישור רפואי"],
    expiresAt: addDays(now, 8).toISOString(),
    createdAt: created,
    openedAt: opened,
    status: "closed",
    closedAt: addDays(now, -1).toISOString(),
  });

  const revoked = request({
    id: "req-revoked",
    title: "עבודות חשמל – אשדוד",
    recipient: { name: "גלעד שמש", phone: "0504444444" },
    labels: ["רישיון חשמלאי"],
    expiresAt: addDays(now, 12).toISOString(),
    createdAt: created,
    openedAt: opened,
    status: "revoked",
    revokedAt: addDays(now, -1).toISOString(),
  });

  const workerComplete: RequestWorkerSubmission = {
    id: "wsub-complete",
    requestId: multi.id,
    submittedFullName: "יוסף מזרחי",
    submittedIdentityNumber: "200000008",
    status: "complete",
    activityId: "act-wsub-complete",
    submittedAt: addDays(now, -1).toISOString(),
  };
  const workerReview: RequestWorkerSubmission = {
    id: "wsub-missing",
    requestId: multi.id,
    submittedFullName: "מיכל חדד",
    status: "needs_review",
    activityId: "act-wsub-missing",
    submittedAt: addDays(now, -1).toISOString(),
  };

  const completeDocs: RequestDocumentSubmission[] = multi.requestedDocuments.map((slot, index) => ({
    id: `dsub-complete-${index + 1}`,
    requestId: multi.id,
    workerSubmissionId: workerComplete.id,
    requestedDocumentId: slot.id,
    sourceFileId: `file-complete-${index + 1}`,
    status: "accepted",
    uploadedAt: addDays(now, -1).toISOString(),
    reviewedAt: addDays(now, -1).toISOString(),
    slotMatch: { result: "match", requestedLabel: slot.label, extractedDocumentTitle: slot.label, evidence: [] },
  }));
  const missingDocsForReview = missingDocs(multi, workerReview.id);
  missingDocsForReview[0] = {
    ...missingDocsForReview[0],
    sourceFileId: "file-missing-1",
    status: "accepted",
    uploadedAt: addDays(now, -1).toISOString(),
    slotMatch: {
      result: "match",
      requestedLabel: multi.requestedDocuments[0].label,
      extractedDocumentTitle: multi.requestedDocuments[0].label,
      evidence: [],
    },
  };

  const sourceFiles = [
    ...completeDocs.map((doc, index) => ({
      id: doc.sourceFileId!,
      fileMeta: {
        name: `complete-${index + 1}.jpg`,
        mime: "image/jpeg",
        sizeLabel: "1.2 MB",
        previewKind: "image" as const,
      },
      uploadedAt: doc.uploadedAt!,
    })),
    {
      id: "file-missing-1",
      fileMeta: {
        name: "id-michal.jpg",
        mime: "image/jpeg",
        sizeLabel: "900 KB",
        previewKind: "image" as const,
      },
      uploadedAt: addDays(now, -1).toISOString(),
    },
  ];

  const requests = [unopened, openedEmpty, multi, expiring, expired, closed, revoked];
  const activity: ActivityItem[] = [
    projectRequestActivity({
      id: "act-req-unopened",
      request: unopened,
      kind: "created",
      now: new Date(unopened.createdAt),
    }),
    projectRequestActivity({
      id: "act-req-opened",
      request: openedEmpty,
      kind: "opened",
      now: new Date(openedEmpty.openedAt!),
    }),
    projectRequestActivity({
      id: "act-req-expiring",
      request: expiring,
      kind: "expiring",
      now,
    }),
    projectRequestActivity({
      id: "act-req-expired",
      request: expired,
      kind: "expired",
      now: new Date(expired.expiresAt),
    }),
    projectRequestActivity({
      id: "act-req-closed",
      request: closed,
      kind: "closed",
      now: new Date(closed.closedAt!),
    }),
    {
      id: workerComplete.activityId!,
      type: "update",
      titleHe: `כל המסמכים עבור ${workerComplete.submittedFullName} התקבלו`,
      metadataHe: multi.title,
      timestamp: workerComplete.submittedAt!,
      openBehavior: "agentic_sheet",
      requestId: multi.id,
      workerSubmissionId: workerComplete.id,
      resolved: true,
    },
    {
      id: workerReview.activityId!,
      type: "action",
      titleHe: `חסר מסמך עבור ${workerReview.submittedFullName}`,
      metadataHe: multi.title,
      timestamp: workerReview.submittedAt!,
      openBehavior: "agentic_sheet",
      requestId: multi.id,
      workerSubmissionId: workerReview.id,
    },
  ];

  return {
    seedAnchor: now.toISOString(),
    requests,
    workerSubmissions: [workerComplete, workerReview],
    documentSubmissions: [...completeDocs, ...missingDocsForReview],
    reuploadLinks: [],
    cases: [
      {
        id: "case-wsub-missing",
        requestId: multi.id,
        workerSubmissionId: workerReview.id,
        activityId: workerReview.activityId!,
        state: "waiting_for_user",
        extraction: {
          fields: {},
          fieldCertainty: {},
          fileReadable: true,
          evidence: [],
        },
        issues: [
          {
            id: "iss-wsub-missing-slot-2",
            code: "requested_document_missing",
            state: "open",
            evidence: [],
            documentSubmissionId: missingDocsForReview[1].id,
          },
        ],
        attempts: [],
        createdAt: workerReview.submittedAt!,
        updatedAt: workerReview.submittedAt!,
      },
    ],
    sourceFiles,
    activity,
    jobs: [],
    undoLog: [],
  };
}
