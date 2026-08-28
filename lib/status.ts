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

/** Documents that count toward an employee's current status. */
export function isStatusDocument(document: DocumentRecord): boolean {
  return (
    document.lifecycle === "active" || document.lifecycle === "needs_review"
  );
}

/** Documents kept as history: replaced or archived, read-only. */
export function isHistoryDocument(document: DocumentRecord): boolean {
  return (
    document.lifecycle === "superseded" || document.lifecycle === "archived"
  );
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

export function documentNeedsReview(document: DocumentRecord): boolean {
  return (
    document.lifecycle === "needs_review" ||
    document.processingStatus === "uncertain" ||
    document.processingStatus === "unreadable" ||
    (document.uncertainFieldKeys?.length ?? 0) > 0
  );
}

export function getEmployeeDocumentStatus(
  employee: Employee,
  documents: DocumentRecord[],
  now = new Date(),
): EmployeeDocumentStatus {
  const counted = documents.filter(
    (document) =>
      document.employeeId === employee.id && isStatusDocument(document),
  );

  if (counted.length === 0) return "no_documents";

  if (counted.some(documentNeedsReview)) {
    return "needs_review";
  }

  if (counted.some((document) => isDocumentExpired(document, now))) {
    return "expired";
  }

  if (counted.some((document) => isDocumentExpiring(document, now))) {
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
    if (!isStatusDocument(document)) continue;
    if (documentNeedsReview(document)) {
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

/** One concise Hebrew explanation for an employee row. */
export function employeeStatusDetailHe(
  employee: Employee,
  documents: DocumentRecord[],
  now = new Date(),
): string {
  const owned = documents.filter(
    (document) => document.employeeId === employee.id,
  );
  const counted = owned.filter(isStatusDocument);
  const status = getEmployeeDocumentStatus(employee, documents, now);

  if (status === "no_documents") return "טרם הועלו מסמכים";

  if (status === "needs_review") {
    const count = counted.filter(documentNeedsReview).length;
    return count === 1 ? "מסמך אחד דורש בדיקה" : `${count} מסמכים דורשים בדיקה`;
  }

  if (status === "expired") {
    const count = counted.filter((document) =>
      isDocumentExpired(document, now),
    ).length;
    return count === 1 ? "מסמך אחד פג תוקף" : `${count} מסמכים פגי תוקף`;
  }

  if (status === "expiring") {
    const expiring = counted
      .filter((document) => isDocumentExpiring(document, now))
      .sort(
        (a, b) => daysUntil(a.expiresOn ?? "", now) - daysUntil(b.expiresOn ?? "", now),
      );
    const days = daysUntil(expiring[0]?.expiresOn ?? "", now);
    if (expiring.length === 1) {
      return days === 0
        ? "אישור אחד פג היום"
        : `אישור אחד יפוג בעוד ${days} ימים`;
    }
    return `${expiring.length} אישורים יפוגו בקרוב`;
  }

  const activeCount = counted.length;
  return activeCount === 1 ? "מסמך פעיל אחד" : `${activeCount} מסמכים פעילים`;
}
