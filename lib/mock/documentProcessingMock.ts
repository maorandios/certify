import { extractionForUploadScenario } from "./requestExtractions";
import type { DemoScenarioId } from "../types";
import type { ExtractionResult } from "../resolution/types";
import type { DocumentProcessingService } from "../services/documentProcessing";

export function mockProcess(
  scenario: DemoScenarioId,
  now = new Date(),
  slotLabel = "מסמך",
  workerName = "עובד",
): ExtractionResult {
  return extractionForUploadScenario(scenario, now, slotLabel, workerName);
}

export function createMockProcessingService(
  readScenario: (jobId: string) => DemoScenarioId,
): DocumentProcessingService {
  return {
    process: async (jobId) => mockProcess(readScenario(jobId)),
    continueCase: async () => {
      throw new Error("continueCase is handled by the store engine");
    },
    retry: async () => {
      throw new Error("retry is handled by the store engine");
    },
    undo: async () => {
      throw new Error("undo is handled by the store engine");
    },
  };
}
