export type Employee = {
  id: string;
  fullName: string;
  identityNumber: string;
  profileImage?: string;
  description?: string;
  createdAt: string;
};

export type EmployeeDocumentStatus =
  | "current"
  | "expiring"
  | "expired"
  | "needs_review"
  | "no_documents";

export type DocumentLifecycle =
  | "processing"
  | "needs_review"
  | "active"
  | "superseded"
  | "archived"
  | "failed";

export type DocumentTypeId =
  | "height_work"
  | "operator"
  | "execution"
  | "professional"
  | "safety"
  | "equipment"
  | "medical";

export type DocumentRecord = {
  id: string;
  employeeId: string;
  typeId: DocumentTypeId;
  title: string;
  issuedOn?: string;
  validFrom?: string;
  expiresOn?: string;
  issuer?: string;
  credentialNumber?: string;
  permissionsHe?: string[];
  restrictionsHe?: string[];
  lifecycle: DocumentLifecycle;
  processingStatus: "ready" | "uncertain" | "unreadable";
  uncertainFieldKeys?: string[];
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
    pages?: number;
  };
  warningDays: number;
  createdAt: string;
};

export type ActivityType = "action" | "alert" | "update" | "processing";

export type ActivityOpenBehavior =
  | "action_sheet"
  | "document_viewer"
  | "employee_details"
  | "jobs_sheet"
  | "result_list"
  | "none";

export type ActivityActionKind =
  | "select_employee"
  | "create_employee"
  | "confirm_field"
  | "replace_file"
  | "confirm_replacement";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  titleHe: string;
  timestamp: string;
  openBehavior: ActivityOpenBehavior;
  metadataHe?: string;
  employeeId?: string;
  relatedEmployeeIds?: string[];
  documentId?: string;
  relatedDocumentIds?: string[];
  jobId?: string;
  requestId?: string;
  /** Decision kind when `openBehavior` is `action_sheet`. */
  actionKind?: ActivityActionKind;
  /** Compact feed quick-action label, when one is shown. */
  actionLabelHe?: string;
  /** Extracted evidence shown inside a decision sheet. */
  evidenceHe?: string;
  /** Candidate employees for select_employee decisions. */
  candidateEmployeeIds?: string[];
  /** Field under confirmation for confirm_field decisions. */
  fieldKey?: "expiresOn" | "identityNumber" | "fullName";
  /** Newly stored document waiting on a replacement decision. */
  pendingDocumentId?: string;
  resolved?: boolean;
  resolvedAt?: string;
};

export type UploadStage =
  | "reading"
  | "identifying"
  | "extracting"
  | "matching"
  | "action_required"
  | "completed"
  | "failed";

export type MockUploadOutcome =
  | "certain_match"
  | "employee_not_found"
  | "ambiguous_employee"
  | "uncertain_field"
  | "unreadable_file"
  | "exact_duplicate"
  | "possible_duplicate"
  | "certain_replacement"
  | "uncertain_replacement";

export type ExtractedFields = {
  fullName: string;
  identityNumber: string;
  typeId: DocumentTypeId;
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
  outcome?: MockUploadOutcome;
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
    pages?: number;
  };
  extracted?: ExtractedFields;
  assignedEmployeeId?: string;
  assignedDocumentId?: string;
  replacedDocumentId?: string;
  /** Request token flow: which document request produced this upload. */
  sourceRequestId?: string;
  /** replace_file flow: activity that stays pending until this job succeeds. */
  resolvesActivityId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShareLink = {
  id: string;
  token: string;
  employeeIds: string[];
  documentIds: string[];
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
};

export type DocumentRequest = {
  id: string;
  token: string;
  employeeId: string;
  documentType?: DocumentTypeId;
  replacesDocumentId?: string;
  messageHe: string;
  createdAt: string;
  expiresAt: string;
  status: "created" | "opened" | "uploaded" | "expired" | "cancelled";
};

export type StatusCounts = Record<EmployeeDocumentStatus, number>;
