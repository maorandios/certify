import type { UploadStage } from "../types";

export const PROCESSING_STAGES: UploadStage[] = [
  "reading",
  "identifying",
  "extracting",
  "matching",
];

export const STAGE_DURATION_MS = 900;

export function nextStage(stage: UploadStage): UploadStage | null {
  const index = PROCESSING_STAGES.indexOf(stage);
  if (index === -1) return null;
  if (index === PROCESSING_STAGES.length - 1) return "completed";
  return PROCESSING_STAGES[index + 1];
}
