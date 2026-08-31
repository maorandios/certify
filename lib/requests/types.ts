import type { DocumentExtraction, EvidenceReference } from "../resolution/types";

export type DocumentRequestStatus = "active" | "closed" | "expired" | "revoked";

export type RequestedDocument = {
  id: string;
  requestId: string;
  label: string;
  instructions?: string;
  sortOrder: number;
};

export type DocumentRequestRecipient = {
  name: string;
  phone?: string;
  email?: string;
};

export type DocumentRequest = {
  id: string;
  title: string;
  recipient: DocumentRequestRecipient;
  requestedDocuments: RequestedDocument[];
  expiresAt: string;
  status: DocumentRequestStatus;
  token: string;
  createdAt: string;
  openedAt?: string;
  closedAt?: string;
  revokedAt?: string;
  messageHe: string;
};

export type RequestWorkerSubmissionStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "needs_review"
  | "complete"
  | "approved"
  | "rejected";

export type RequestWorkerSubmission = {
  id: string;
  requestId: string;
  submittedFullName: string;
  submittedIdentityNumber?: string;
  status: RequestWorkerSubmissionStatus;
  activityId?: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
};

export type RequestDocumentSubmissionStatus =
  | "missing"
  | "uploaded"
  | "processing"
  | "needs_review"
  | "accepted"
  | "rejected"
  | "expired";

export type RequestedSlotMatch = {
  result: "match" | "mismatch" | "uncertain";
  requestedLabel: string;
  extractedDocumentTitle?: string;
  evidence: EvidenceReference[];
};

export type RequestDocumentSubmission = {
  id: string;
  requestId: string;
  workerSubmissionId: string;
  requestedDocumentId: string;
  sourceFileId?: string;
  status: RequestDocumentSubmissionStatus;
  extraction?: DocumentExtraction;
  slotMatch?: RequestedSlotMatch;
  resolutionCaseId?: string;
  uploadedAt?: string;
  reviewedAt?: string;
};

export type RequestReuploadLink = {
  id: string;
  token: string;
  requestId: string;
  workerSubmissionId: string;
  requestedDocumentId: string;
  expiresAt: string;
  revokedAt?: string;
  resolvedAt?: string;
};

export type SubmissionPulseBucket = "needs_review" | "waiting" | "complete";

export type SubmissionPulse = {
  needsReview: number;
  waiting: number;
  complete: number;
  submitted: number;
};

export type RequestListBadge =
  | "unopened"
  | "active"
  | "closed"
  | "expired"
  | "revoked";
