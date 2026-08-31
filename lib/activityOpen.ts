import {
  resolveAgenticSheetContent,
  type AgenticSheetContentKind,
} from "./agenticSheet";
import type { ResolutionCase } from "./resolution/types";
import type { ActivityItem, ActivityOpenBehavior, SourceFile, UploadJob } from "./types";
import type { DocumentRequest, RequestWorkerSubmission } from "./requests/types";

export type ActivityOpenContext = {
  requests: DocumentRequest[];
  workerSubmissions: RequestWorkerSubmission[];
  jobs: UploadJob[];
  cases?: ResolutionCase[];
  sourceFiles?: SourceFile[];
};

export type ActivityOpenIntent =
  | {
      type: "agentic_sheet";
      activityId: string;
      contentKind: AgenticSheetContentKind;
    }
  | { type: "none" };

export function isActivityInteractive(
  item: ActivityItem,
): boolean {
  return item.openBehavior === "agentic_sheet" || item.openBehavior === "jobs";
}

export function activityHasChevron(item: ActivityItem): boolean {
  return isActivityInteractive(item);
}

export function inferOpenBehavior(item: ActivityItem): ActivityOpenBehavior {
  if (item.openBehavior) return item.openBehavior;
  if (item.workerSubmissionId || item.requestId) return "agentic_sheet";
  if (item.jobId) return "jobs";
  return "none";
}

export function resolveActivityOpen(
  item: ActivityItem,
  ctx: ActivityOpenContext,
): ActivityOpenIntent {
  const behavior = inferOpenBehavior(item);
  if (behavior === "none") return { type: "none" };
  return {
    type: "agentic_sheet",
    activityId: item.id,
    contentKind: resolveAgenticSheetContent(item, ctx),
  };
}

export function stampActivity(item: ActivityItem): ActivityItem {
  return item;
}
