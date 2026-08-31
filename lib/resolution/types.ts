import type { DocumentValidity, ExtractedFields } from "../types";

export type { DocumentValidity };

export type FieldCertainty = "certain" | "uncertain" | "missing";

export type EvidenceReference = {
  id: string;
  field?: string;
  quoteHe?: string;
  locationHint?: string;
};

export type ExtractedValue<T> = {
  value: T | null;
  certainty: FieldCertainty;
  evidence: EvidenceReference[];
  source: "document" | "user_confirmed";
};

export type ExtractedExtension = {
  label: ExtractedValue<string>;
  value?: ExtractedValue<string>;
};

/** Canonical AI/mock document facts. No candidates, actions, or UI. */
export type DocumentExtraction = {
  employee: {
    fullName: ExtractedValue<string>;
    identityNumber: ExtractedValue<string>;
  };
  document: {
    title: ExtractedValue<string>;
    certificateNumber: ExtractedValue<string>;
    issuer: ExtractedValue<string>;
    performedAt: ExtractedValue<string>;
    validity: DocumentValidity;
    extensions: ExtractedExtension[];
  };
  fileReadable: boolean;
  evidence: EvidenceReference[];
};

export type ExtractionResult = {
  fields: Partial<ExtractedFields>;
  fieldCertainty: Partial<Record<keyof ExtractedFields, FieldCertainty>>;
  fileReadable: boolean;
  evidence: EvidenceReference[];
  unclassified?: boolean;
  validity?: DocumentValidity;
  document?: DocumentExtraction;
};

export type ResolutionCaseState =
  | "investigating"
  | "waiting_for_user"
  | "resolving"
  | "resolved"
  | "failed";

export const RESOLUTION_PROBLEM_CODES = [
  "worker_name_missing",
  "worker_name_conflict",
  "worker_identity_conflict",
  "requested_document_missing",
  "wrong_document_for_slot",
  "slot_match_uncertain",
  "file_unreadable",
  "field_uncertain",
  "validity_unknown",
  "document_expired",
  "duplicate_within_submission",
  "unknown",
] as const;

export type ResolutionProblemCode = (typeof RESOLUTION_PROBLEM_CODES)[number];

export function isResolutionProblemCode(
  value: string,
): value is ResolutionProblemCode {
  return (RESOLUTION_PROBLEM_CODES as readonly string[]).includes(value);
}

export function normalizeProblemCode(value: string): ResolutionProblemCode {
  if (value === "file_quality") return "file_unreadable";
  if (isResolutionProblemCode(value)) return value;
  return "unknown";
}

export function isValidityProblem(code: ResolutionProblemCode): boolean {
  return code === "validity_unknown" || code === "field_uncertain";
}

export type ResolutionProposal = {
  action: string;
  targetId?: string;
  value?: unknown;
  explanationHe: string;
};

export type ResolutionOption = {
  id: string;
  labelHe: string;
  descriptionHe?: string;
};

export type ResolutionQuestion =
  | {
      type: "yes_no";
      title: string;
      description?: string;
      confirmLabel: string;
      rejectLabel: string;
    }
  | {
      type: "choose_one";
      title: string;
      description?: string;
      options: ResolutionOption[];
    }
  | {
      type: "enter_value";
      title: string;
      description?: string;
      field: string;
      currentValue?: string;
    }
  | {
      type: "validity";
      title: string;
      description?: string;
      field: "expiresOn";
      currentValue?: string;
      noExpiryLabel: string;
    }
  | {
      type: "review";
      title: string;
      description?: string;
    };

export type ResolutionIssue = {
  id: string;
  code: ResolutionProblemCode;
  state: "open" | "resolved" | "dismissed";
  evidence: EvidenceReference[];
  proposedResolution?: ResolutionProposal;
  question?: ResolutionQuestion;
  documentSubmissionId?: string;
};

export type ResolutionAttempt = {
  id: string;
  kind: "automatic" | "user_answer";
  descriptionHe: string;
  at: string;
};

export type UndoableAction = {
  actionId: string;
  labelHe: string;
  validUntil: string;
};

export type ResolutionCase = {
  id: string;
  requestId: string;
  workerSubmissionId: string;
  documentSubmissionId?: string;
  sourceFileId?: string;
  jobId?: string;
  activityId: string;
  state: ResolutionCaseState;
  extraction: ExtractionResult;
  issues: ResolutionIssue[];
  attempts: ResolutionAttempt[];
  undoable?: UndoableAction;
  deferredAt?: string;
  nextTransitionAt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  qaScenarioId?: string;
};

export type IssueResolution = {
  issueId: string;
  decision: "confirm" | "reject" | "correct";
  value?: string;
};

export type ConfirmReviewAnswer = {
  type: "confirm_review";
  resolutions: IssueResolution[];
};

export type ResolutionAnswer =
  | { type: "confirm_issue"; issueId: string }
  | { type: "reject_issue"; issueId: string }
  | { type: "choose"; issueId: string; optionId: string }
  | { type: "enter_value"; issueId: string; field: string; value: string }
  | { type: "mark_no_expiry"; issueId: string }
  | { type: "edit_worker_name"; value: string }
  | { type: "edit_worker_identity"; value: string }
  | { type: "confirm_slot_match" }
  | { type: "accept_document" }
  | { type: "reject_document" }
  | { type: "approve_worker" }
  | { type: "reject_worker" }
  | ConfirmReviewAnswer
  | { type: "defer" }
  | { type: "resume" };

export type CaseSurface = "inline" | "workspace" | "status";

export type AnswerError =
  | "unknown_issue"
  | "missing_value"
  | "invalid_decision"
  | "case_not_found";

export const emptyExtraction: ExtractionResult = {
  fields: {},
  fieldCertainty: {},
  fileReadable: true,
  evidence: [],
};
