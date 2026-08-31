import { workerIdentityIssues } from "../requests/identityConsistency";
import type {
  RequestDocumentSubmission,
  RequestWorkerSubmission,
} from "../requests/types";
import { isDatedExpired } from "./validity";
import type {
  CaseSurface,
  ExtractionResult,
  ResolutionCase,
  ResolutionIssue,
  ResolutionProblemCode,
} from "./types";

function issue(
  id: string,
  code: ResolutionProblemCode,
  extras?: Partial<ResolutionIssue>,
): ResolutionIssue {
  return {
    id,
    code,
    state: "open",
    evidence: extras?.evidence ?? [],
    documentSubmissionId: extras?.documentSubmissionId,
    question: extras?.question,
    proposedResolution: extras?.proposedResolution,
  };
}

export function detectDocumentIssues(input: {
  document: RequestDocumentSubmission;
  extraction?: ExtractionResult;
  now?: Date;
}): ResolutionIssue[] {
  const now = input.now ?? new Date();
  const doc = input.document;
  const extraction = input.extraction ?? {
    fields: {},
    fieldCertainty: {},
    fileReadable: doc.extraction?.fileReadable ?? true,
    evidence: doc.extraction?.evidence ?? [],
    document: doc.extraction,
    validity: doc.extraction?.document.validity,
  };
  const issues: ResolutionIssue[] = [];
  const prefix = `iss-${doc.id}`;

  if (extraction.unclassified) {
    issues.push(issue(`${prefix}-unknown`, "unknown", { documentSubmissionId: doc.id }));
    return issues;
  }

  if (extraction.fileReadable === false) {
    issues.push(issue(`${prefix}-unreadable`, "file_unreadable", { documentSubmissionId: doc.id }));
    return issues;
  }

  if (doc.slotMatch?.result === "mismatch") {
    issues.push(issue(`${prefix}-wrong`, "wrong_document_for_slot", { documentSubmissionId: doc.id }));
  } else if (doc.slotMatch?.result === "uncertain") {
    issues.push(issue(`${prefix}-slot`, "slot_match_uncertain", { documentSubmissionId: doc.id }));
  }

  const titleCertainty =
    extraction.document?.document.title.certainty ?? extraction.fieldCertainty.title;
  if (titleCertainty === "uncertain") {
    issues.push(issue(`${prefix}-title`, "field_uncertain", { documentSubmissionId: doc.id }));
  }

  const extensions = extraction.document?.document.extensions ?? [];
  if (
    extensions.some(
      (entry) =>
        entry.value?.certainty === "uncertain" || entry.label.certainty === "uncertain",
    ) ||
    extraction.fields.uncertainFieldKeys?.includes("permissionsHe")
  ) {
    issues.push(issue(`${prefix}-ext`, "field_uncertain", { documentSubmissionId: doc.id }));
  }

  const validity = extraction.validity ?? extraction.document?.document.validity;
  if (validity?.mode === "unknown") {
    issues.push(issue(`${prefix}-validity`, "validity_unknown", { documentSubmissionId: doc.id }));
  } else if (validity?.mode === "dated") {
    if (validity.certainty === "uncertain") {
      issues.push(issue(`${prefix}-validity`, "validity_unknown", { documentSubmissionId: doc.id }));
    } else if (isDatedExpired(validity.expiresOn, now)) {
      issues.push(issue(`${prefix}-expired`, "document_expired", { documentSubmissionId: doc.id }));
    }
  }

  return issues;
}

export function detectWorkerIssues(input: {
  worker: RequestWorkerSubmission;
  documents: RequestDocumentSubmission[];
  submitted: boolean;
}): ResolutionIssue[] {
  const issues: ResolutionIssue[] = [];
  const prefix = `iss-${input.worker.id}`;

  if (input.submitted) {
    const missing = input.documents.filter((doc) => doc.status === "missing");
    for (const doc of missing) {
      issues.push(
        issue(`${prefix}-missing-${doc.requestedDocumentId}`, "requested_document_missing", {
          documentSubmissionId: doc.id,
        }),
      );
    }
  }

  for (const code of workerIdentityIssues({
    worker: input.worker,
    documents: input.documents,
  })) {
    issues.push(issue(`${prefix}-${code}`, code));
  }

  const acceptedOrUploaded = input.documents.filter(
    (doc) => doc.extraction && doc.status !== "missing" && doc.status !== "rejected",
  );
  const seen = new Map<string, string>();
  for (const doc of acceptedOrUploaded) {
    const title = doc.extraction?.document.title.value?.trim();
    const cred = doc.extraction?.document.certificateNumber.value?.trim();
    if (!title || !cred) continue;
    const key = `${title}|${cred}`;
    const prev = seen.get(key);
    if (prev) {
      issues.push(
        issue(`${prefix}-dup-${doc.id}`, "duplicate_within_submission", {
          documentSubmissionId: doc.id,
        }),
      );
    } else {
      seen.set(key, doc.id);
    }
  }

  return issues;
}

export function deriveCaseSurface(resolution: ResolutionCase): CaseSurface {
  if (resolution.state === "investigating" || resolution.state === "resolving") {
    return "status";
  }
  const open = resolution.issues.filter((issue) => issue.state === "open");
  if (open.length > 1) return "workspace";
  return "inline";
}

export function primaryOpenCode(
  cases: ResolutionCase[],
): ResolutionProblemCode | undefined {
  const open = cases.flatMap((entry) =>
    entry.issues.filter((issue) => issue.state === "open"),
  );
  if (open.some((issue) => issue.code === "unknown")) return "unknown";
  if (open.length === 1) return open[0]?.code;
  if (open.length > 1) return open[0]?.code;
  return undefined;
}
