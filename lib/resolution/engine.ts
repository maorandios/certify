import { newId } from "../ids";
import { matchRequestedSlot } from "../requests/slotMatch";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  RequestDocumentSubmissionStatus,
  RequestReuploadLink,
  RequestWorkerSubmission,
  RequestWorkerSubmissionStatus,
} from "../requests/types";
import type { ActivityItem, SourceFile, UploadJob } from "../types";
import {
  attachDocumentExtraction,
  toDocumentExtraction,
} from "./extraction";
import { detectDocumentIssues, detectWorkerIssues } from "./policy";
import { projectWorkerSubmissionToActivity } from "./projection";
import type {
  ExtractionResult,
  ResolutionAnswer,
  ResolutionCase,
  ResolutionIssue,
} from "./types";
import { emptyExtraction } from "./types";
import { applyValidityToExtraction } from "./validity";

export type ResolutionWorld = {
  requests: DocumentRequest[];
  workerSubmissions: RequestWorkerSubmission[];
  documentSubmissions: RequestDocumentSubmission[];
  reuploadLinks: RequestReuploadLink[];
  cases: ResolutionCase[];
  sourceFiles: SourceFile[];
  activity: ActivityItem[];
  jobs: UploadJob[];
  undoLog: Array<{
    actionId: string;
    snapshot: Omit<ResolutionWorld, "undoLog">;
    at: string;
  }>;
};

function upsertActivity(activity: ActivityItem[], item: ActivityItem | null) {
  if (!item) return activity;
  const index = activity.findIndex((entry) => entry.id === item.id);
  if (index === -1) return [item, ...activity].slice(0, 80);
  const next = [...activity];
  next[index] = item;
  return next;
}

function replace<T extends { id: string }>(list: T[], item: T): T[] {
  return list.map((entry) => (entry.id === item.id ? item : entry));
}

export function emptyWorld(): ResolutionWorld {
  return {
    requests: [],
    workerSubmissions: [],
    documentSubmissions: [],
    reuploadLinks: [],
    cases: [],
    sourceFiles: [],
    activity: [],
    jobs: [],
    undoLog: [],
  };
}

export function deriveDocumentStatus(
  doc: RequestDocumentSubmission,
  cases: ResolutionCase[],
): RequestDocumentSubmissionStatus {
  if (!doc.sourceFileId && doc.status === "missing") return "missing";
  if (doc.status === "rejected") return "rejected";
  const caseFor = cases.find((entry) => entry.documentSubmissionId === doc.id);
  if (caseFor?.state === "investigating" || caseFor?.state === "resolving") {
    return "processing";
  }
  const open = (caseFor?.issues ?? []).filter((issue) => issue.state === "open");
  if (open.some((issue) => issue.code === "document_expired")) return "expired";
  if (open.length > 0) return "needs_review";
  if (doc.extraction && doc.slotMatch?.result === "match") return "accepted";
  if (doc.extraction) return "accepted";
  if (doc.sourceFileId) return "uploaded";
  return doc.status;
}

export function deriveWorkerStatus(
  worker: RequestWorkerSubmission,
  documents: RequestDocumentSubmission[],
  cases: ResolutionCase[],
): RequestWorkerSubmissionStatus {
  if (worker.status === "draft") return "draft";
  if (worker.status === "rejected") return "rejected";
  const mine = documents.filter((doc) => doc.workerSubmissionId === worker.id);
  const related = cases.filter((entry) => entry.workerSubmissionId === worker.id);
  if (related.some((entry) => entry.state === "investigating" || entry.state === "resolving")) {
    return "processing";
  }
  const open = related.flatMap((entry) =>
    entry.issues.filter((issue) => issue.state === "open"),
  );
  if (open.length > 0) return "needs_review";
  if (mine.some((doc) => doc.status === "processing" || doc.status === "uploaded")) {
    return "processing";
  }
  if (worker.status === "approved") return "approved";
  const allAccepted =
    mine.length > 0 &&
    mine.every((doc) => doc.status === "accepted" || doc.status === "rejected");
  if (allAccepted && mine.some((doc) => doc.status === "accepted")) return "complete";
  return "needs_review";
}

export function evaluateWorker(
  world: ResolutionWorld,
  workerId: string,
  now: Date,
): ResolutionWorld {
  const worker = world.workerSubmissions.find((entry) => entry.id === workerId);
  if (!worker) return world;
  const request = world.requests.find((entry) => entry.id === worker.requestId);
  const documents = world.documentSubmissions.filter(
    (doc) => doc.workerSubmissionId === workerId,
  );
  const submitted = Boolean(worker.submittedAt);

  let cases = world.cases.map((entry) => {
    if (entry.workerSubmissionId !== workerId) return entry;
    if (!entry.documentSubmissionId) return entry;
    const doc = documents.find((item) => item.id === entry.documentSubmissionId);
    if (!doc?.extraction || entry.state === "investigating") return entry;
    const extraction: ExtractionResult = {
      fields: {},
      fieldCertainty: {},
      fileReadable: doc.extraction.fileReadable,
      evidence: doc.extraction.evidence,
      document: doc.extraction,
      validity: doc.extraction.document.validity,
    };
    const detected = detectDocumentIssues({ document: doc, extraction, now });
    const preserved = entry.issues.filter(
      (issue) =>
        issue.state !== "open" &&
        detected.some((next) => next.code === issue.code),
    );
    const openCodes = new Set(
      entry.issues.filter((issue) => issue.state !== "open").map((issue) => issue.code),
    );
    const nextIssues = [
      ...preserved,
      ...detected.filter((issue) => !openCodes.has(issue.code)),
    ];
    const open = nextIssues.filter((issue) => issue.state === "open");
    const failed = nextIssues.some(
      (issue) => issue.state === "open" && issue.code === "file_unreadable",
    );
    return {
      ...entry,
      issues: nextIssues,
      state: failed
        ? "failed"
        : open.length > 0
          ? "waiting_for_user"
          : "resolved",
      resolvedAt: open.length === 0 ? now.toISOString() : undefined,
      updatedAt: now.toISOString(),
    } satisfies ResolutionCase;
  });

  const workerCase = cases.find(
    (entry) => entry.workerSubmissionId === workerId && !entry.documentSubmissionId,
  );
  if (workerCase && submitted) {
    const detected = detectWorkerIssues({ worker, documents, submitted });
    const preserved = workerCase.issues.filter((issue) => issue.state !== "open");
    const closedCodes = new Set(preserved.map((issue) => `${issue.code}:${issue.documentSubmissionId ?? ""}`));
    const nextIssues = [
      ...preserved,
      ...detected.filter(
        (issue) => !closedCodes.has(`${issue.code}:${issue.documentSubmissionId ?? ""}`),
      ),
    ];
    const open = nextIssues.filter((issue) => issue.state === "open");
    cases = replace(cases, {
      ...workerCase,
      issues: nextIssues,
      state: open.length > 0 ? "waiting_for_user" : "resolved",
      resolvedAt: open.length === 0 ? now.toISOString() : undefined,
      updatedAt: now.toISOString(),
    });
  }

  const documentsNext = documents.map((doc) => ({
    ...doc,
        status: deriveDocumentStatus(doc, cases),
  }));
  let workerNext: RequestWorkerSubmission = {
    ...worker,
    status: deriveWorkerStatus(worker, documentsNext, cases),
  };
  if (worker.status === "approved" && workerNext.status === "processing") {
    workerNext = { ...workerNext, status: "processing", approvedAt: undefined };
  }

  const allDocuments = world.documentSubmissions.map((doc) =>
    doc.workerSubmissionId === workerId
      ? documentsNext.find((item) => item.id === doc.id) ?? doc
      : doc,
  );
  const activity = upsertActivity(
    world.activity,
    projectWorkerSubmissionToActivity({
      worker: workerNext,
      request,
      documents: documentsNext,
      cases,
      previous: world.activity.find((entry) => entry.id === worker.activityId),
      now,
    }),
  );

  let reuploadLinks = world.reuploadLinks;
  for (const doc of documentsNext) {
    if (doc.status === "accepted") {
      reuploadLinks = resolveLinksForSlot(reuploadLinks, doc, now);
    }
  }

  return {
    ...world,
    cases,
    documentSubmissions: allDocuments,
    workerSubmissions: replace(world.workerSubmissions, workerNext),
    activity,
    reuploadLinks,
  };
}

export function createWorkerCase(input: {
  worker: RequestWorkerSubmission;
  now: Date;
  qaScenarioId?: string;
}): ResolutionCase {
  const at = input.now.toISOString();
  return {
    id: `case-${input.worker.id}`,
    requestId: input.worker.requestId,
    workerSubmissionId: input.worker.id,
    activityId: input.worker.activityId ?? `act-${input.worker.id}`,
    state: "waiting_for_user",
    extraction: emptyExtraction,
    issues: [],
    attempts: [],
    createdAt: at,
    updatedAt: at,
    qaScenarioId: input.qaScenarioId,
  };
}

export function createInvestigatingCase(input: {
  job: UploadJob;
  sourceFile: SourceFile;
  worker: RequestWorkerSubmission;
  document: RequestDocumentSubmission;
  now: Date;
  nextTransitionAt: string;
  qaScenarioId?: string;
}): ResolutionCase {
  const at = input.now.toISOString();
  return {
    id: `case-${input.document.id}`,
    requestId: input.worker.requestId,
    workerSubmissionId: input.worker.id,
    documentSubmissionId: input.document.id,
    sourceFileId: input.sourceFile.id,
    jobId: input.job.id,
    activityId: input.worker.activityId ?? `act-${input.worker.id}`,
    state: "investigating",
    extraction: emptyExtraction,
    issues: [],
    attempts: [],
    nextTransitionAt: input.nextTransitionAt,
    createdAt: at,
    updatedAt: at,
    qaScenarioId: input.qaScenarioId,
  };
}

export function applyExtraction(
  world: ResolutionWorld,
  caseId: string,
  extraction: ExtractionResult,
  now: Date,
): ResolutionWorld {
  const resolution = world.cases.find((entry) => entry.id === caseId);
  if (!resolution?.documentSubmissionId) return world;
  const document = world.documentSubmissions.find(
    (entry) => entry.id === resolution.documentSubmissionId,
  );
  const request = world.requests.find((entry) => entry.id === resolution.requestId);
  const slot = request?.requestedDocuments.find(
    (entry) => entry.id === document?.requestedDocumentId,
  );
  const hydrated = attachDocumentExtraction(extraction);
  const facts = toDocumentExtraction(hydrated);
  const slotMatch = document
    ? matchRequestedSlot({
        requestedLabel: slot?.label ?? "",
        extractedDocumentTitle: facts.document.title.value,
        evidence: facts.evidence.filter((entry) => entry.field === "title"),
      })
    : undefined;

  const nextDoc = document
    ? {
        ...document,
        extraction: facts,
        slotMatch,
        status: "processing" as const,
        resolutionCaseId: resolution.id,
      }
    : undefined;

  const nextCase: ResolutionCase = {
    ...resolution,
    extraction: hydrated,
    state: "resolving",
    updatedAt: now.toISOString(),
  };

  const extracted: ResolutionWorld = {
    ...world,
    cases: replace(world.cases, nextCase),
    documentSubmissions: nextDoc
      ? replace(world.documentSubmissions, nextDoc)
      : world.documentSubmissions,
  };
  return evaluateWorker(extracted, resolution.workerSubmissionId, now);
}

function resolveIssue(issues: ResolutionIssue[], issueId: string): ResolutionIssue[] {
  return issues.map((issue) =>
    issue.id === issueId ? { ...issue, state: "resolved" as const } : issue,
  );
}

export function applyAnswer(
  world: ResolutionWorld,
  caseId: string,
  answer: ResolutionAnswer,
  now: Date,
): { world: ResolutionWorld; resolution: ResolutionCase; error?: string } {
  const resolution = world.cases.find((entry) => entry.id === caseId);
  if (!resolution) {
    return { world, resolution: world.cases[0]!, error: "case_not_found" };
  }
  let nextCase = resolution;
  let workers = world.workerSubmissions;
  let documents = world.documentSubmissions;
  let reuploadLinks = world.reuploadLinks;
  const worker = workers.find((entry) => entry.id === resolution.workerSubmissionId);

  if (answer.type === "defer") {
    nextCase = { ...nextCase, deferredAt: now.toISOString(), updatedAt: now.toISOString() };
  } else if (answer.type === "resume") {
    nextCase = { ...nextCase, deferredAt: undefined, updatedAt: now.toISOString() };
  } else if (answer.type === "edit_worker_name" && worker) {
    workers = replace(workers, { ...worker, submittedFullName: answer.value });
  } else if (answer.type === "edit_worker_identity" && worker) {
    workers = replace(workers, { ...worker, submittedIdentityNumber: answer.value });
  } else if (answer.type === "approve_worker" && worker) {
    workers = replace(workers, {
      ...worker,
      status: "approved",
      approvedAt: now.toISOString(),
      reviewedAt: now.toISOString(),
    });
  } else if (answer.type === "reject_worker" && worker) {
    workers = replace(workers, { ...worker, status: "rejected", reviewedAt: now.toISOString() });
  } else if (answer.type === "accept_document" && resolution.documentSubmissionId) {
    const doc = documents.find((entry) => entry.id === resolution.documentSubmissionId);
    if (doc) {
      documents = replace(documents, {
        ...doc,
        status: "accepted",
        reviewedAt: now.toISOString(),
      });
      nextCase = {
        ...nextCase,
        issues: nextCase.issues.map((issue) => ({ ...issue, state: "resolved" as const })),
      };
      reuploadLinks = resolveLinksForSlot(reuploadLinks, doc, now);
    }
  } else if (answer.type === "reject_document" && resolution.documentSubmissionId) {
    const doc = documents.find((entry) => entry.id === resolution.documentSubmissionId);
    if (doc) {
      documents = replace(documents, { ...doc, status: "rejected", reviewedAt: now.toISOString() });
    }
  } else if (answer.type === "confirm_slot_match" && resolution.documentSubmissionId) {
    const doc = documents.find((entry) => entry.id === resolution.documentSubmissionId);
    if (doc?.slotMatch) {
      documents = replace(documents, {
        ...doc,
        slotMatch: { ...doc.slotMatch, result: "match" },
      });
    }
    const slotIssue = nextCase.issues.find((issue) => issue.code === "slot_match_uncertain");
    if (slotIssue) nextCase = { ...nextCase, issues: resolveIssue(nextCase.issues, slotIssue.id) };
  } else if (answer.type === "mark_no_expiry") {
    nextCase = {
      ...nextCase,
      extraction: applyValidityToExtraction(nextCase.extraction, {
        mode: "no_expiry",
        certainty: "user_confirmed",
        evidence: [],
      }),
      issues: nextCase.issues.map((issue) =>
        issue.code === "validity_unknown" ? { ...issue, state: "resolved" } : issue,
      ),
    };
    if (resolution.documentSubmissionId) {
      const doc = documents.find((entry) => entry.id === resolution.documentSubmissionId);
      if (doc?.extraction) {
        documents = replace(documents, {
          ...doc,
          extraction: {
            ...doc.extraction,
            document: {
              ...doc.extraction.document,
              validity: { mode: "no_expiry", certainty: "user_confirmed", evidence: [] },
            },
          },
        });
      }
    }
  } else if (answer.type === "enter_value") {
    if (!answer.value.trim()) {
      return { world, resolution, error: "missing_value" };
    }
    if (answer.field === "expiresOn") {
      nextCase = {
        ...nextCase,
        extraction: applyValidityToExtraction(nextCase.extraction, {
          mode: "dated",
          expiresOn: answer.value,
          certainty: "certain",
          evidence: [],
        }),
        issues: nextCase.issues.map((issue) =>
          issue.code === "validity_unknown" ? { ...issue, state: "resolved" } : issue,
        ),
      };
    }
    const target = nextCase.issues.find((issue) => issue.id === answer.issueId);
    if (target) nextCase = { ...nextCase, issues: resolveIssue(nextCase.issues, target.id) };
  } else if (answer.type === "confirm_issue" || answer.type === "reject_issue") {
    nextCase = { ...nextCase, issues: resolveIssue(nextCase.issues, answer.issueId) };
  } else if (answer.type === "confirm_review") {
    for (const item of answer.resolutions) {
      if (item.decision === "correct" && !item.value?.trim()) {
        return { world, resolution, error: "missing_value" };
      }
      nextCase = { ...nextCase, issues: resolveIssue(nextCase.issues, item.issueId) };
    }
  } else if (answer.type === "choose") {
    nextCase = { ...nextCase, issues: resolveIssue(nextCase.issues, answer.issueId) };
  }

  let next: ResolutionWorld = {
    ...world,
    cases: replace(world.cases, {
      ...nextCase,
      attempts: [
        ...nextCase.attempts,
        { id: newId("att"), kind: "user_answer", descriptionHe: answer.type, at: now.toISOString() },
      ],
      updatedAt: now.toISOString(),
    }),
    workerSubmissions: workers,
    documentSubmissions: documents,
    reuploadLinks,
  };
  next = evaluateWorker(next, resolution.workerSubmissionId, now);
  const live = next.cases.find((entry) => entry.id === caseId) ?? nextCase;
  return { world: next, resolution: live };
}

function resolveLinksForSlot(
  links: RequestReuploadLink[],
  doc: RequestDocumentSubmission,
  now: Date,
): RequestReuploadLink[] {
  return links.map((link) => {
    if (
      link.workerSubmissionId === doc.workerSubmissionId &&
      link.requestedDocumentId === doc.requestedDocumentId &&
      !link.revokedAt &&
      !link.resolvedAt
    ) {
      return { ...link, resolvedAt: now.toISOString() };
    }
    return link;
  });
}

export function markReuploadResolvedIfAccepted(
  world: ResolutionWorld,
  document: RequestDocumentSubmission,
  now: Date,
): ResolutionWorld {
  if (document.status !== "accepted") return world;
  return {
    ...world,
    reuploadLinks: resolveLinksForSlot(world.reuploadLinks, document, now),
  };
}

export function applyUndo(
  world: ResolutionWorld,
  actionId: string,
): ResolutionWorld {
  const entry = world.undoLog.find((item) => item.actionId === actionId);
  if (!entry) return world;
  return { ...entry.snapshot, undoLog: world.undoLog.filter((item) => item.actionId !== actionId) };
}

export function snapshotWorld(world: ResolutionWorld) {
  return {
    requests: world.requests,
    workerSubmissions: world.workerSubmissions,
    documentSubmissions: world.documentSubmissions,
    reuploadLinks: world.reuploadLinks,
    cases: world.cases,
    sourceFiles: world.sourceFiles,
    activity: world.activity,
    jobs: world.jobs,
  };
}
