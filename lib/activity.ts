import { copy, documentTypeLabels, uploadStageLabels } from "./copy";
import { formatDotDate } from "./dates";
import {
  isDocumentExpired,
  isDocumentExpiring,
} from "./status";
import type {
  ActivityItem,
  DocumentRecord,
  UploadJob,
  UploadStage,
} from "./types";

const STAGE_PROGRESS: Record<UploadStage, number> = {
  reading: 0.2,
  identifying: 0.4,
  extracting: 0.65,
  matching: 0.85,
  action_required: 1,
  completed: 1,
  failed: 1,
};

/**
 * Items shown in the feed: resolved actionable events are hidden because
 * their outcome is represented by a newer update item.
 */
export function visibleActivityItems(items: ActivityItem[]): ActivityItem[] {
  return items.filter((item) => !item.resolved);
}

export function sortActivityItems(
  items: ActivityItem[],
  documents: DocumentRecord[],
  now = new Date(),
): ActivityItem[] {
  return [...items].sort((left, right) => {
    const rankDelta = activityRank(left, documents, now) - activityRank(right, documents, now);
    if (rankDelta !== 0) return rankDelta;
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}

function activityRank(
  item: ActivityItem,
  documents: DocumentRecord[],
  now: Date,
): number {
  if (item.type === "action") return 0;
  if (item.type === "alert") {
    const document = documents.find((entry) => entry.id === item.documentId);
    if (document && isDocumentExpired(document, now)) return 1;
    return 2;
  }
  if (item.type === "processing") return 3;
  return 4;
}

export function documentMetadataHe(document: DocumentRecord): string {
  const typeLabel = documentTypeLabels[document.typeId];
  if (!document.expiresOn) return typeLabel;
  if (isDocumentExpired(document)) {
    return `${typeLabel} · פג ב־${formatDotDate(document.expiresOn)}`;
  }
  return `${typeLabel} · בתוקף עד ${formatDotDate(document.expiresOn)}`;
}

export function isExpiringAlert(
  item: ActivityItem,
  documents: DocumentRecord[],
  now = new Date(),
): boolean {
  if (item.type !== "alert" || !item.documentId) return false;
  const document = documents.find((entry) => entry.id === item.documentId);
  return Boolean(document && isDocumentExpiring(document, now));
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
    titleHe:
      active.length === 1
        ? "מעבדים מסמך"
        : `מעבדים ${active.length} מסמכים`,
    timestamp: active[0].updatedAt,
    metadataHe:
      active.length === 1
        ? uploadStageLabels[active[0].stage]
        : copy.processingSupport,
    jobId: active[0].id,
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
    (item) =>
      !item.resolved && (item.type === "action" || item.type === "alert"),
  ).length;
}
