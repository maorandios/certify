import type { ExtractionResult, ResolutionAnswer, ResolutionCase } from "../resolution/types";

export interface DocumentProcessingService {
  process(jobId: string): Promise<ExtractionResult>;
  continueCase(caseId: string, answer: ResolutionAnswer): Promise<ResolutionCase>;
  retry(caseId: string): Promise<ResolutionCase>;
  undo(actionId: string): Promise<ResolutionCase>;
}
