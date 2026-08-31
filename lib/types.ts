export type {
  DocumentRequest,
  DocumentRequestRecipient,
  DocumentRequestStatus,
  RequestDocumentSubmission,
  RequestDocumentSubmissionStatus,
  RequestedDocument,
  RequestedSlotMatch,
  RequestListBadge,
  RequestReuploadLink,
  RequestWorkerSubmission,
  RequestWorkerSubmissionStatus,
  SubmissionPulse,
} from "./requests/types";

export type ValidityEvidence = {
  id: string;
  field?: string;
  quoteHe?: string;
  locationHint?: string;
};

export type DocumentValidity =
  | {
      mode: "dated";
      expiresOn: string;
      certainty: "certain" | "uncertain";
      evidence: ValidityEvidence[];
    }
  | {
      mode: "no_expiry";
      certainty: "certain" | "user_confirmed";
      evidence: ValidityEvidence[];
    }
  | {
      mode: "unknown";
      reason: "date_not_found" | "date_unreadable" | "conflicting_dates";
      evidence: ValidityEvidence[];
    };

export type ActivityType = "action" | "alert" | "update" | "processing";

export type ActivityOpenBehavior = "agentic_sheet" | "jobs" | "none";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  titleHe: string;
  timestamp: string;
  openBehavior: ActivityOpenBehavior;
  metadataHe?: string;
  requestId?: string;
  workerSubmissionId?: string;
  documentSubmissionId?: string;
  jobId?: string;
  caseId?: string;
  sourceFileId?: string;
  deferred?: boolean;
  actionLabelHe?: string;
  evidenceHe?: string;
  resolved?: boolean;
  resolvedAt?: string;
  qaScenarioId?: string;
  qaOrder?: number;
};

export type UploadStage =
  | "reading"
  | "identifying"
  | "extracting"
  | "matching"
  | "action_required"
  | "completed"
  | "failed";

export type SourceFile = {
  id: string;
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
    pages?: number;
  };
  uploadedAt: string;
};

export type DemoScenarioId =
  | "certain_match"
  | "unreadable_file"
  | "wrong_slot"
  | "slot_uncertain"
  | "missing_expiry"
  | "no_expiry_stated"
  | "name_conflict"
  | "identity_conflict"
  | "field_uncertain"
  | "expired_doc"
  | "duplicate"
  | "unknown"
  | "processing_active";

export const EXTRACTION_DEMO_SCENARIOS: DemoScenarioId[] = [
  "certain_match",
  "unreadable_file",
  "wrong_slot",
  "slot_uncertain",
  "missing_expiry",
  "no_expiry_stated",
  "name_conflict",
  "identity_conflict",
  "field_uncertain",
  "expired_doc",
  "duplicate",
  "unknown",
];

export function isExtractionDemoScenario(value: DemoScenarioId): boolean {
  return (EXTRACTION_DEMO_SCENARIOS as readonly string[]).includes(value);
}

/** @deprecated Use DemoScenarioId. */
export type MockUploadOutcome = DemoScenarioId;

export type ExtractedFields = {
  fullName: string;
  identityNumber: string;
  title: string;
  issuedOn?: string;
  validFrom?: string;
  expiresOn?: string;
  issuer?: string;
  credentialNumber?: string;
  permissionsHe?: string[];
  restrictionsHe?: string[];
  uncertainFieldKeys?: string[];
};

export type UploadJob = {
  id: string;
  stage: UploadStage;
  scenario?: DemoScenarioId;
  outcome?: DemoScenarioId;
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
    pages?: number;
  };
  extracted?: ExtractedFields;
  requestId?: string;
  workerSubmissionId?: string;
  documentSubmissionId?: string;
  requestedDocumentId?: string;
  sourceRequestId?: string;
  createdAt: string;
  updatedAt: string;
};

export type SlotUploadContext = {
  requestId: string;
  workerSubmissionId: string;
  requestedDocumentId: string;
};
