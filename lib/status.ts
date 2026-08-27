import type {
  DocumentRecord,
  Employee,
  EmployeeDocumentStatus,
  StatusCounts,
} from "./types";
import { daysUntil } from "./dates";

export const DEFAULT_WARNING_DAYS = 30;

export function isActiveDocument(document: DocumentRecord): boolean {
  return document.lifecycle === "active";
}

export function isDocumentExpired(
  document: DocumentRecord,
  now = new Date(),
): boolean {
  if (!document.expiresOn) return false;
  return daysUntil(document.expiresOn, now) < 0;
}

export function isDocumentExpiring(
  document: DocumentRecord,
  now = new Date(),
): boolean {
  if (!document.expiresOn || isDocumentExpired(document, now)) return false;
  const warning = document.warningDays ?? DEFAULT_WARNING_DAYS;
  const remaining = daysUntil(document.expiresOn, now);
  return remaining <= warning;
}

export function getEmployeeDocumentStatus(
  employee: Employee,
  documents: DocumentRecord[],
  now = new Date(),
): EmployeeDocumentStatus {
  const active = documents.filter(
    (document) =>
      document.employeeId === employee.id && isActiveDocument(document),
  );

  if (active.length === 0) return "no_documents";

  if (
    active.some(
      (document) =>
        document.processingStatus === "uncertain" ||
        document.processingStatus === "unreadable" ||
        (document.uncertainFieldKeys?.length ?? 0) > 0,
    )
  ) {
    return "needs_review";
  }

  if (active.some((document) => isDocumentExpired(document, now))) {
    return "expired";
  }

  if (active.some((document) => isDocumentExpiring(document, now))) {
    return "expiring";
  }

  return "current";
}

export function getStatusCounts(
  employees: Employee[],
  documents: DocumentRecord[],
  now = new Date(),
): StatusCounts {
  const counts: StatusCounts = {
    current: 0,
    expiring: 0,
    expired: 0,
    needs_review: 0,
    no_documents: 0,
  };

  for (const employee of employees) {
    counts[getEmployeeDocumentStatus(employee, documents, now)] += 1;
  }

  return counts;
}

export function hasAttentionStatus(counts: StatusCounts): boolean {
  return (
    counts.expired > 0 || counts.expiring > 0 || counts.needs_review > 0
  );
}

export type DocumentAttention = {
  expired: number;
  expiring: number;
  needsReview: number;
};

function needsReview(document: DocumentRecord): boolean {
  return (
    document.processingStatus === "uncertain" ||
    document.processingStatus === "unreadable" ||
    (document.uncertainFieldKeys?.length ?? 0) > 0
  );
}

export function getDocumentAttention(
  documents: DocumentRecord[],
  now = new Date(),
): DocumentAttention {
  const attention: DocumentAttention = {
    expired: 0,
    expiring: 0,
    needsReview: 0,
  };

  for (const document of documents) {
    if (!isActiveDocument(document)) continue;
    if (needsReview(document)) {
      attention.needsReview += 1;
    } else if (isDocumentExpired(document, now)) {
      attention.expired += 1;
    } else if (isDocumentExpiring(document, now)) {
      attention.expiring += 1;
    }
  }

  return attention;
}

export function attentionTotal(attention: DocumentAttention): number {
  return attention.expired + attention.expiring + attention.needsReview;
}
