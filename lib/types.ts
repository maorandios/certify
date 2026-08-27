export type Employee = {
  id: string;
  fullName: string;
  identityNumber: string;
  phone?: string;
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

export type DocumentLifecycle = "active" | "superseded" | "archived";

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
  expiresOn?: string;
  issuer?: string;
  credentialNumber?: string;
  permissionsHe?: string[];
  lifecycle: DocumentLifecycle;
  processingStatus: "ready" | "uncertain" | "unreadable";
  uncertainFieldKeys?: string[];
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
  };
  warningDays: number;
  createdAt: string;
};

export type ActivityType = "action" | "alert" | "update" | "processing";

export type ActivityActionKind = "openUpload" | "openJobs" | "openDecision";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  titleHe: string;
  employeeId?: string;
  relatedEmployeeIds?: string[];
  documentId?: string;
  jobId?: string;
  timestamp: string;
  metadataHe?: string;
  action?: {
    labelHe: string;
    kind: ActivityActionKind;
  };
};

export type UploadStage =
  | "reading"
  | "identifying"
  | "extracting"
  | "matching"
  | "completed"
  | "failed";

export type UploadJob = {
  id: string;
  stage: UploadStage;
  fileMeta: {
    name: string;
    mime: string;
    sizeLabel: string;
    previewKind: "image" | "pdf";
  };
  extracted?: {
    fullName: string;
    identityNumber: string;
    typeId: DocumentTypeId;
    title: string;
    issuedOn: string;
    expiresOn: string;
    issuer: string;
    credentialNumber: string;
    permissionsHe: string[];
  };
  assignedEmployeeId?: string;
  assignedDocumentId?: string;
  replacedDocumentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type StatusCounts = Record<EmployeeDocumentStatus, number>;
