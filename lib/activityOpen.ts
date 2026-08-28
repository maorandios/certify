import type {
  ActivityActionKind,
  ActivityItem,
  ActivityOpenBehavior,
  DocumentRecord,
  Employee,
  UploadJob,
} from "./types";

export type ActivityOpenContext = {
  employees: Employee[];
  documents: DocumentRecord[];
  jobs: UploadJob[];
};

export type ActivityOpenIntent =
  | { type: "action_sheet"; item: ActivityItem }
  | { type: "document_viewer"; documentId: string }
  | { type: "employee_details"; employeeId: string }
  | { type: "jobs_sheet"; jobId: string }
  | { type: "result_list"; documentIds: string[] }
  | { type: "create_employee"; item: ActivityItem }
  | { type: "replace_file"; item: ActivityItem }
  | { type: "none" };

const DECISION_KINDS: readonly ActivityActionKind[] = [
  "select_employee",
  "create_employee",
  "confirm_field",
  "replace_file",
  "confirm_replacement",
];

export function isDecisionKind(
  kind: ActivityActionKind | undefined,
): kind is ActivityActionKind {
  return Boolean(kind && DECISION_KINDS.includes(kind));
}

/** Infer a destination when callers don't set `openBehavior` explicitly. */
export function inferOpenBehavior(
  item: Omit<ActivityItem, "openBehavior">,
): ActivityOpenBehavior {
  if (isDecisionKind(item.actionKind)) return "action_sheet";
  if ((item.relatedDocumentIds?.length ?? 0) > 1) return "result_list";
  if (item.relatedDocumentIds?.length === 1 || item.documentId) {
    return "document_viewer";
  }
  if (item.type === "processing" && item.jobId) return "jobs_sheet";
  if (item.employeeId) return "employee_details";
  return "none";
}

export function stampActivity(
  item: Omit<ActivityItem, "openBehavior"> & {
    openBehavior?: ActivityOpenBehavior;
  },
): ActivityItem {
  return {
    ...item,
    openBehavior: item.openBehavior ?? inferOpenBehavior(item),
  };
}

function existingDocument(
  ctx: ActivityOpenContext,
  documentId: string | undefined,
): DocumentRecord | undefined {
  if (!documentId) return undefined;
  return ctx.documents.find((entry) => entry.id === documentId);
}

function existingEmployee(
  ctx: ActivityOpenContext,
  employeeId: string | undefined,
): Employee | undefined {
  if (!employeeId) return undefined;
  return ctx.employees.find((entry) => entry.id === employeeId);
}

function existingJob(
  ctx: ActivityOpenContext,
  jobId: string | undefined,
): UploadJob | undefined {
  if (!jobId) return undefined;
  return ctx.jobs.find((entry) => entry.id === jobId);
}

function existingRelatedDocuments(
  ctx: ActivityOpenContext,
  ids: string[] | undefined,
): DocumentRecord[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => existingDocument(ctx, id))
    .filter((entry): entry is DocumentRecord => Boolean(entry));
}

/**
 * Effective destination after runtime guards. Missing targets become `none`
 * so the Feed does not show a chevron or open an empty surface.
 */
export function resolveOpenBehavior(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): ActivityOpenBehavior {
  switch (item.openBehavior) {
    case "action_sheet": {
      if (!isDecisionKind(item.actionKind)) return "none";
      if (item.actionKind === "select_employee") {
        const candidates = (item.candidateEmployeeIds ?? [])
          .map((id) => existingEmployee(ctx, id))
          .filter(Boolean);
        return candidates.length > 0 ? "action_sheet" : "none";
      }
      if (item.actionKind === "confirm_field") {
        return existingDocument(ctx, item.documentId)
          ? "action_sheet"
          : "none";
      }
      if (item.actionKind === "confirm_replacement") {
        return existingDocument(ctx, item.pendingDocumentId)
          ? "action_sheet"
          : "none";
      }
      return "action_sheet";
    }
    case "document_viewer":
      return existingDocument(ctx, item.documentId)
        ? "document_viewer"
        : "none";
    case "employee_details":
      return existingEmployee(ctx, item.employeeId)
        ? "employee_details"
        : "none";
    case "jobs_sheet": {
      const job = existingJob(ctx, item.jobId);
      if (!job) return "none";
      if (job.stage === "completed" || job.stage === "failed") {
        if (existingDocument(ctx, job.assignedDocumentId)) {
          return "document_viewer";
        }
        if (existingEmployee(ctx, job.assignedEmployeeId)) {
          return "employee_details";
        }
        return "none";
      }
      return "jobs_sheet";
    }
    case "result_list": {
      const docs = existingRelatedDocuments(ctx, item.relatedDocumentIds);
      if (docs.length > 1) return "result_list";
      if (docs.length === 1) return "document_viewer";
      return "none";
    }
    case "none":
      return "none";
    default:
      return "none";
  }
}

export function isActivityInteractive(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): boolean {
  return resolveOpenBehavior(item, ctx) !== "none";
}

export function activityHasChevron(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): boolean {
  return isActivityInteractive(item, ctx);
}

export function resolveActivityOpen(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): ActivityOpenIntent {
  const behavior = resolveOpenBehavior(item, ctx);

  switch (behavior) {
    case "action_sheet": {
      if (item.actionKind === "create_employee") {
        return { type: "create_employee", item };
      }
      if (item.actionKind === "replace_file") {
        return { type: "replace_file", item };
      }
      return { type: "action_sheet", item };
    }
    case "document_viewer": {
      const documentId =
        existingRelatedDocuments(ctx, item.relatedDocumentIds)[0]?.id ??
        existingDocument(ctx, item.documentId)?.id ??
        existingJob(ctx, item.jobId)?.assignedDocumentId;
      return documentId
        ? { type: "document_viewer", documentId }
        : { type: "none" };
    }
    case "employee_details": {
      const employeeId =
        existingEmployee(ctx, item.employeeId)?.id ??
        existingJob(ctx, item.jobId)?.assignedEmployeeId;
      return employeeId
        ? { type: "employee_details", employeeId }
        : { type: "none" };
    }
    case "jobs_sheet":
      return item.jobId
        ? { type: "jobs_sheet", jobId: item.jobId }
        : { type: "none" };
    case "result_list":
      return {
        type: "result_list",
        documentIds: existingRelatedDocuments(
          ctx,
          item.relatedDocumentIds,
        ).map((doc) => doc.id),
      };
    case "none":
      return { type: "none" };
  }
}
