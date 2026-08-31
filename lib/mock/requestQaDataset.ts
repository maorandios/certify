import { addDays } from "../dates";
import { buildRequestMessageHe } from "../requests/message";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  RequestReuploadLink,
  RequestWorkerSubmission,
} from "../requests/types";
import {
  applyAnswer,
  applyExtraction,
  createInvestigatingCase,
  createWorkerCase,
  evaluateWorker,
  emptyWorld,
  type ResolutionWorld,
} from "../resolution/engine";
import { projectRequestActivity } from "../resolution/projection";
import type { ActivityItem, SourceFile, UploadJob } from "../types";
import { extractionForUploadScenario } from "./requestExtractions";
import { STAGE_DURATION_MS } from "./uploadMachine";

export const REQUEST_QA_SCENARIO_IDS = [
  "request_unopened",
  "request_opened_empty",
  "worker_complete",
  "worker_approved",
  "worker_missing_slot",
  "worker_draft_silent",
  "file_unreadable",
  "wrong_slot",
  "slot_uncertain",
  "name_conflict",
  "identity_conflict",
  "document_expired",
  "validity_unknown",
  "duplicate_within",
  "multiple_issues",
  "request_expiring",
  "request_expired",
  "request_closed_future",
  "request_closed_past",
  "request_revoked",
  "reupload_open",
  "unknown",
] as const;

export type RequestQaScenarioId = (typeof REQUEST_QA_SCENARIO_IDS)[number];

export type RequestQaDataset = ResolutionWorld & {
  generatedAt: string;
};

function makeRequest(input: {
  id: string;
  title: string;
  labels: string[];
  now: Date;
  expiresInHours: number;
  opened?: boolean;
  status?: DocumentRequest["status"];
}): DocumentRequest {
  const token = `qa-r-${input.id.replace(/^qa-req-/, "")}token12ab`;
  const requestedDocuments = input.labels.map((label, index) => ({
    id: `qa-slot-${input.id}-${index + 1}`,
    requestId: input.id,
    label,
    sortOrder: index,
  }));
  return {
    id: input.id,
    title: input.title,
    recipient: { name: "דניאל כהן", phone: "0500000000", email: "daniel@example.com" },
    requestedDocuments,
    expiresAt: new Date(input.now.getTime() + input.expiresInHours * 3600_000).toISOString(),
    status: input.status ?? "active",
    token,
    createdAt: addDays(input.now, -2).toISOString(),
    openedAt: input.opened ? addDays(input.now, -1).toISOString() : undefined,
    closedAt: input.status === "closed" ? addDays(input.now, -1).toISOString() : undefined,
    revokedAt: input.status === "revoked" ? addDays(input.now, -1).toISOString() : undefined,
    messageHe: buildRequestMessageHe({
      title: input.title,
      recipientName: "דניאל כהן",
      documents: requestedDocuments,
      url: `/r/${token}`,
    }),
  };
}

function source(id: string, now: Date): SourceFile {
  return {
    id,
    fileMeta: {
      name: `${id}.jpg`,
      mime: "image/jpeg",
      sizeLabel: "1.0 MB",
      previewKind: "image",
    },
    uploadedAt: now.toISOString(),
  };
}

function jobFor(doc: RequestDocumentSubmission, now: Date): UploadJob {
  return {
    id: `qa-job-${doc.id}`,
    stage: "completed",
    fileMeta: source(`qa-file-${doc.id}`, now).fileMeta,
    requestId: doc.requestId,
    workerSubmissionId: doc.workerSubmissionId,
    documentSubmissionId: doc.id,
    requestedDocumentId: doc.requestedDocumentId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function addSubmittedWorker(
  world: ResolutionWorld,
  input: {
    request: DocumentRequest;
    workerId: string;
    name: string;
    identity?: string;
    now: Date;
    qaScenarioId: RequestQaScenarioId;
    qaOrder: number;
    files: Array<{ slotIndex: number; scenario: Parameters<typeof extractionForUploadScenario>[0] }>;
    skipMissingSlots?: boolean;
    approve?: boolean;
  },
): ResolutionWorld {
  const worker: RequestWorkerSubmission = {
    id: input.workerId,
    requestId: input.request.id,
    submittedFullName: input.name,
    submittedIdentityNumber: input.identity,
    status: "processing",
    activityId: `qa-act-${input.workerId}`,
    submittedAt: input.now.toISOString(),
  };
  const docs: RequestDocumentSubmission[] = input.request.requestedDocuments.map((slot, index) => ({
    id: `qa-dsub-${input.workerId}-${index + 1}`,
    requestId: input.request.id,
    workerSubmissionId: worker.id,
    requestedDocumentId: slot.id,
    status: "missing",
  }));
  let next: ResolutionWorld = {
    ...world,
    workerSubmissions: [...world.workerSubmissions, worker],
    documentSubmissions: [...world.documentSubmissions, ...docs],
    cases: [createWorkerCase({ worker, now: input.now, qaScenarioId: input.qaScenarioId }), ...world.cases],
  };

  for (const file of input.files) {
    const doc = docs[file.slotIndex];
    const slot = input.request.requestedDocuments[file.slotIndex];
    const fileId = `qa-file-${doc.id}`;
    const uploadJob = jobFor(doc, input.now);
    const sourceFile = source(fileId, input.now);
    const uploaded: RequestDocumentSubmission = {
      ...doc,
      sourceFileId: fileId,
      status: "uploaded",
      uploadedAt: input.now.toISOString(),
    };
    const investigating = createInvestigatingCase({
      job: uploadJob,
      sourceFile,
      worker,
      document: uploaded,
      now: input.now,
      nextTransitionAt: new Date(input.now.getTime() + STAGE_DURATION_MS).toISOString(),
      qaScenarioId: input.qaScenarioId,
    });
    next = {
      ...next,
      jobs: [...next.jobs, uploadJob],
      sourceFiles: [...next.sourceFiles, sourceFile],
      documentSubmissions: next.documentSubmissions.map((entry) =>
        entry.id === doc.id ? { ...uploaded, resolutionCaseId: investigating.id } : entry,
      ),
      cases: [investigating, ...next.cases],
    };
    const extraction = extractionForUploadScenario(file.scenario, input.now, slot.label, input.name);
    next = applyExtraction(next, investigating.id, extraction, input.now);
  }

  next = evaluateWorker(next, worker.id, input.now);
  if (input.approve) {
    const workerCase = next.cases.find(
      (entry) => entry.workerSubmissionId === worker.id && !entry.documentSubmissionId,
    );
    if (workerCase) {
      next = applyAnswer(next, workerCase.id, { type: "approve_worker" }, input.now).world;
    }
  }

  next = {
    ...next,
    activity: next.activity.map((entry) =>
      entry.workerSubmissionId === worker.id
        ? { ...entry, qaScenarioId: input.qaScenarioId, qaOrder: input.qaOrder }
        : entry,
    ),
  };
  return next;
}

export function createRequestQaDataset(now: Date): RequestQaDataset {
  let world = emptyWorld();
  const requests: DocumentRequest[] = [];
  const activities: ActivityItem[] = [];
  const reuploadLinks: RequestReuploadLink[] = [];

  function pushRequest(
    request: DocumentRequest,
    kind: "created" | "opened" | "expiring" | "expired" | "closed",
    qaScenarioId: RequestQaScenarioId,
    qaOrder: number,
  ) {
    requests.push(request);
    activities.push(
      projectRequestActivity({
        id: `qa-act-${request.id}`,
        request,
        kind,
        now,
        qaScenarioId,
        qaOrder,
      }),
    );
  }

  const unopened = makeRequest({
    id: "qa-req-unopened",
    title: "בקשה חדשה שלא נפתחה",
    labels: ["צילום תעודת זהות"],
    now,
    expiresInHours: 72,
  });
  pushRequest(unopened, "created", "request_unopened", 1);

  const opened = makeRequest({
    id: "qa-req-opened",
    title: "בקשה שנפתחה בלי הגשות",
    labels: ["אישור עבודה בגובה"],
    now,
    expiresInHours: 48,
    opened: true,
  });
  pushRequest(opened, "opened", "request_opened_empty", 2);

  const completeReq = makeRequest({
    id: "qa-req-complete",
    title: "עובד אחד שלם",
    labels: ["צילום תעודת זהות", "אישור עבודה בגובה"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(completeReq);

  const approvedReq = makeRequest({
    id: "qa-req-approved",
    title: "עובד שאושר",
    labels: ["הדרכת בטיחות"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(approvedReq);

  const missingReq = makeRequest({
    id: "qa-req-missing",
    title: "עובד עם Slot חסר",
    labels: ["צילום תעודת זהות", "רישיון חשמלאי"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(missingReq);

  const draftReq = makeRequest({
    id: "qa-req-draft",
    title: "טיוטה נטושה",
    labels: ["צילום תעודת זהות"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(draftReq);

  const issuesReq = makeRequest({
    id: "qa-req-issues",
    title: "תרחישי מסמך",
    labels: ["אישור עבודה בגובה"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(issuesReq);

  const multiReq = makeRequest({
    id: "qa-req-multi",
    title: "כמה בעיות יחד",
    labels: ["אישור עבודה בגובה"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  requests.push(multiReq);

  const expiring = makeRequest({
    id: "qa-req-expiring",
    title: "קישור עומד לפוג",
    labels: ["הדרכת בטיחות"],
    now,
    expiresInHours: 8,
    opened: true,
  });
  pushRequest(expiring, "expiring", "request_expiring", 16);

  const expired = makeRequest({
    id: "qa-req-expired",
    title: "קישור שפג",
    labels: ["הדרכת בטיחות"],
    now,
    expiresInHours: -12,
    opened: true,
    status: "expired",
  });
  pushRequest(expired, "expired", "request_expired", 17);

  const closedFuture = makeRequest({
    id: "qa-req-closed-future",
    title: "בקשה סגורה עם תפוגה עתידית",
    labels: ["אישור רפואי"],
    now,
    expiresInHours: 48,
    opened: true,
    status: "closed",
  });
  pushRequest(closedFuture, "closed", "request_closed_future", 18);

  const closedPast = makeRequest({
    id: "qa-req-closed-past",
    title: "בקשה סגורה שפגה",
    labels: ["אישור רפואי"],
    now,
    expiresInHours: -6,
    opened: true,
    status: "closed",
  });
  pushRequest(closedPast, "closed", "request_closed_past", 19);

  const revoked = makeRequest({
    id: "qa-req-revoked",
    title: "בקשה שבוטלה",
    labels: ["אישור רפואי"],
    now,
    expiresInHours: 48,
    opened: true,
    status: "revoked",
  });
  pushRequest(revoked, "closed", "request_revoked", 20);

  world = { ...world, requests, activity: activities };

  world = addSubmittedWorker(world, {
    request: completeReq,
    workerId: "qa-wsub-complete",
    name: "יוסף מזרחי",
    identity: "200000008",
    now,
    qaScenarioId: "worker_complete",
    qaOrder: 3,
    files: [
      { slotIndex: 0, scenario: "certain_match" },
      { slotIndex: 1, scenario: "certain_match" },
    ],
  });

  world = addSubmittedWorker(world, {
    request: approvedReq,
    workerId: "qa-wsub-approved",
    name: "מיכל חדד",
    identity: "200000016",
    now,
    qaScenarioId: "worker_approved",
    qaOrder: 4,
    files: [{ slotIndex: 0, scenario: "certain_match" }],
    approve: true,
  });

  world = addSubmittedWorker(world, {
    request: missingReq,
    workerId: "qa-wsub-missing",
    name: "עומר שמש",
    now,
    qaScenarioId: "worker_missing_slot",
    qaOrder: 5,
    files: [{ slotIndex: 0, scenario: "certain_match" }],
  });

  const draftWorker: RequestWorkerSubmission = {
    id: "qa-wsub-draft",
    requestId: draftReq.id,
    submittedFullName: "טיוטה נטושה",
    status: "draft",
  };
  world = {
    ...world,
    workerSubmissions: [...world.workerSubmissions, draftWorker],
    documentSubmissions: [
      ...world.documentSubmissions,
      {
        id: "qa-dsub-draft-1",
        requestId: draftReq.id,
        workerSubmissionId: draftWorker.id,
        requestedDocumentId: draftReq.requestedDocuments[0].id,
        status: "missing",
      },
    ],
  };

  const issueWorkers: Array<{
    id: string;
    scenario: RequestQaScenarioId;
    order: number;
    upload: Parameters<typeof extractionForUploadScenario>[0];
    name: string;
  }> = [
    { id: "qa-wsub-unreadable", scenario: "file_unreadable", order: 7, upload: "unreadable_file", name: "קובץ מטושטש" },
    { id: "qa-wsub-wrong", scenario: "wrong_slot", order: 8, upload: "wrong_slot", name: "קובץ שגוי" },
    { id: "qa-wsub-slot", scenario: "slot_uncertain", order: 9, upload: "slot_uncertain", name: "התאמה לא ודאית" },
    { id: "qa-wsub-name", scenario: "name_conflict", order: 10, upload: "name_conflict", name: "סתירת שם" },
    { id: "qa-wsub-id", scenario: "identity_conflict", order: 11, upload: "identity_conflict", name: "סתירת זהות" },
    { id: "qa-wsub-expired", scenario: "document_expired", order: 12, upload: "expired_doc", name: "מסמך פג" },
    { id: "qa-wsub-validity", scenario: "validity_unknown", order: 13, upload: "missing_expiry", name: "תוקף לא ברור" },
    { id: "qa-wsub-unknown", scenario: "unknown", order: 22, upload: "unknown", name: "בעיה לא מוכרת" },
  ];

  for (const item of issueWorkers) {
    world = addSubmittedWorker(world, {
      request: issuesReq,
      workerId: item.id,
      name: item.name,
      identity: item.scenario === "identity_conflict" ? "999999993" : undefined,
      now,
      qaScenarioId: item.scenario,
      qaOrder: item.order,
      files: [{ slotIndex: 0, scenario: item.upload }],
    });
  }

  world = addSubmittedWorker(world, {
    request: multiReq,
    workerId: "qa-wsub-multi",
    name: "כמה בעיות",
    now,
    qaScenarioId: "multiple_issues",
    qaOrder: 15,
    files: [{ slotIndex: 0, scenario: "field_uncertain" }],
  });

  const dupReq = makeRequest({
    id: "qa-req-dup",
    title: "כפילות באותה הגשה",
    labels: ["אישור עבודה בגובה", "אישור עבודה בגובה נוסף"],
    now,
    expiresInHours: 96,
    opened: true,
  });
  world = { ...world, requests: [...world.requests, dupReq] };
  world = addSubmittedWorker(world, {
    request: dupReq,
    workerId: "qa-wsub-dup",
    name: "כפילות פנימית",
    now,
    qaScenarioId: "duplicate_within",
    qaOrder: 14,
    files: [
      { slotIndex: 0, scenario: "duplicate" },
      { slotIndex: 1, scenario: "duplicate" },
    ],
  });

  const reuploadWorker = world.workerSubmissions.find((entry) => entry.id === "qa-wsub-unreadable");
  if (reuploadWorker) {
    reuploadLinks.push({
      id: "qa-ulink-open",
      token: "qa-u-unreadable-slot1token",
      requestId: issuesReq.id,
      workerSubmissionId: reuploadWorker.id,
      requestedDocumentId: issuesReq.requestedDocuments[0].id,
      expiresAt: issuesReq.expiresAt,
    });
  }

  return {
    ...world,
    reuploadLinks,
    generatedAt: now.toISOString(),
  };
}

