import type { RequestDocumentSubmission, RequestWorkerSubmission } from "./types";

function compactIdentity(value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, "");
  return digits && digits.length >= 5 ? digits : undefined;
}

function normalizeName(value: string | undefined): string | undefined {
  const next = value?.replace(/\s+/g, " ").trim();
  return next || undefined;
}

function namesConflict(left: string, right: string): boolean {
  const a = normalizeName(left);
  const b = normalizeName(right);
  if (!a || !b) return false;
  if (a === b) return false;
  const aTokens = new Set(a.split(" "));
  const shared = b.split(" ").filter((token) => aTokens.has(token));
  return shared.length === 0;
}

export function workerIdentityIssues(input: {
  worker: RequestWorkerSubmission;
  documents: RequestDocumentSubmission[];
}): Array<"worker_name_missing" | "worker_name_conflict" | "worker_identity_conflict"> {
  const issues: Array<
    "worker_name_missing" | "worker_name_conflict" | "worker_identity_conflict"
  > = [];
  const submittedName = normalizeName(input.worker.submittedFullName);
  if (!submittedName) issues.push("worker_name_missing");

  const extractedNames = input.documents
    .map((doc) => normalizeName(doc.extraction?.employee.fullName.value ?? undefined))
    .filter((value): value is string => Boolean(value));
  const extractedIds = input.documents
    .map((doc) => compactIdentity(doc.extraction?.employee.identityNumber.value ?? undefined))
    .filter((value): value is string => Boolean(value));

  if (submittedName) {
    if (extractedNames.some((name) => namesConflict(submittedName, name))) {
      issues.push("worker_name_conflict");
    }
  } else if (extractedNames.length >= 2) {
    const first = extractedNames[0];
    if (extractedNames.some((name) => namesConflict(first, name))) {
      issues.push("worker_name_conflict");
    }
  }

  const submittedId = compactIdentity(input.worker.submittedIdentityNumber);
  const idPool = submittedId ? [submittedId, ...extractedIds] : extractedIds;
  if (new Set(idPool).size > 1) {
    issues.push("worker_identity_conflict");
  }

  return issues;
}
