import type { ResolutionCase } from "./resolution/types";
import type { ActivityItem } from "./types";
import type { ActivityOpenContext } from "./activityOpen";

export const AGENTIC_SHEET_CONTENT_KINDS = [
  "worker_review",
  "request_summary",
  "processing_status",
  "generic_review",
] as const;

export type AgenticSheetContentKind = (typeof AGENTIC_SHEET_CONTENT_KINDS)[number];

export function isAgenticSheetContentKind(
  value: string,
): value is AgenticSheetContentKind {
  return (AGENTIC_SHEET_CONTENT_KINDS as readonly string[]).includes(value);
}

export function resolveAgenticSheetContent(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): AgenticSheetContentKind {
  const cases = (ctx.cases ?? []).filter((entry) =>
    item.workerSubmissionId
      ? entry.workerSubmissionId === item.workerSubmissionId
      : false,
  );
  const resolution: ResolutionCase | undefined = item.caseId
    ? ctx.cases?.find((entry) => entry.id === item.caseId)
    : cases[0];

  if (resolution?.state === "investigating" || resolution?.state === "resolving") {
    return "processing_status";
  }
  if (item.workerSubmissionId) return "worker_review";
  if (item.requestId) return "request_summary";
  return "generic_review";
}
