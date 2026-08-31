import { copy, uploadStageLabels } from "./copy";
import type { ActivityItem, UploadJob, UploadStage } from "./types";

const STAGE_PROGRESS: Record<UploadStage, number> = {
  reading: 0.2,
  identifying: 0.4,
  extracting: 0.65,
  matching: 0.85,
  action_required: 1,
  completed: 1,
  failed: 1,
};

export function visibleActivityItems(items: ActivityItem[]): ActivityItem[] {
  return items.filter((item) => item.workerSubmissionId || item.requestId || !item.resolved);
}

export function sortActivityItems(items: ActivityItem[]): ActivityItem[] {
  return [...items].sort((left, right) => {
    if (left.qaOrder != null && right.qaOrder != null && left.qaOrder !== right.qaOrder) {
      return left.qaOrder - right.qaOrder;
    }
    const rankDelta = activityRank(left) - activityRank(right);
    if (rankDelta !== 0) return rankDelta;
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}

function activityRank(item: ActivityItem): number {
  if (item.type === "action") return item.deferred ? 3.5 : 0;
  if (item.type === "alert") return 1;
  if (item.type === "processing") return 3;
  return 4;
}

const PROCESSING_SET: UploadStage[] = [
  "reading",
  "identifying",
  "extracting",
  "matching",
];

export function buildProcessingActivity(jobs: UploadJob[]): ActivityItem | null {
  const active = jobs.filter((job) => PROCESSING_SET.includes(job.stage));
  if (active.length === 0) return null;
  return {
    id: "act-processing-live",
    type: "processing",
    titleHe: active.length === 1 ? "מעבדים מסמך" : `מעבדים ${active.length} מסמכים`,
    timestamp: active[0].updatedAt,
    metadataHe:
      active.length === 1 ? uploadStageLabels[active[0].stage] : copy.processingSupport,
    jobId: active[0].id,
    openBehavior: "jobs",
  };
}

export function processingProgress(jobs: UploadJob[]): number {
  const active = jobs.filter((job) => PROCESSING_SET.includes(job.stage));
  if (active.length === 0) return 0;
  const total = active.reduce((sum, job) => sum + STAGE_PROGRESS[job.stage], 0);
  return total / active.length;
}

export function unresolvedActivityCount(items: ActivityItem[]): number {
  return items.filter(
    (item) => !item.resolved && (item.type === "action" || item.type === "alert"),
  ).length;
}
