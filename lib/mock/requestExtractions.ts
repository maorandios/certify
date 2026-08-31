import { isoDaysFrom } from "../dates";
import type { DemoScenarioId } from "../types";
import {
  extractedValue,
  hydrateExtraction,
  missingExtractedValue,
} from "../resolution/extraction";
import type { DocumentExtraction, ExtractionResult } from "../resolution/types";

function baseFacts(input: {
  name: string;
  identity?: string;
  title: string;
  now: Date;
  expiresInDays?: number;
  noExpiry?: boolean;
  readable?: boolean;
}): DocumentExtraction {
  const validity = input.noExpiry
    ? {
        mode: "no_expiry" as const,
        certainty: "certain" as const,
        evidence: [{ id: "ev-no-exp", quoteHe: "ללא הגבלת זמן" }],
      }
    : input.expiresInDays != null
      ? {
          mode: "dated" as const,
          expiresOn: isoDaysFrom(input.now, input.expiresInDays),
          certainty: "certain" as const,
          evidence: [],
        }
      : {
          mode: "unknown" as const,
          reason: "date_not_found" as const,
          evidence: [],
        };
  return {
    employee: {
      fullName: extractedValue(input.name, "certain"),
      identityNumber: input.identity
        ? extractedValue(input.identity, "certain")
        : missingExtractedValue(),
    },
    document: {
      title: extractedValue(input.title, "certain"),
      certificateNumber: extractedValue("8821", "certain"),
      issuer: extractedValue("מכון הכשרה", "certain"),
      performedAt: extractedValue(isoDaysFrom(input.now, -30), "certain"),
      validity,
      extensions: [],
    },
    fileReadable: input.readable ?? true,
    evidence: [],
  };
}

export function extractionForUploadScenario(
  scenario: DemoScenarioId,
  now: Date,
  slotLabel: string,
  workerName: string,
): ExtractionResult {
  switch (scenario) {
    case "unreadable_file":
      return hydrateExtraction({
        ...baseFacts({ name: workerName, title: slotLabel, now, readable: false }),
        fileReadable: false,
      });
    case "wrong_slot":
      return hydrateExtraction(
        baseFacts({ name: workerName, title: "רישיון נהיגה", now, expiresInDays: 365 }),
      );
    case "slot_uncertain":
      return hydrateExtraction({
        ...baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }),
        document: {
          ...baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }).document,
          title: extractedValue(slotLabel, "uncertain"),
        },
      });
    case "missing_expiry":
      return hydrateExtraction(baseFacts({ name: workerName, title: slotLabel, now }));
    case "no_expiry_stated":
      return hydrateExtraction(baseFacts({ name: workerName, title: slotLabel, now, noExpiry: true }));
    case "name_conflict":
      return hydrateExtraction(
        baseFacts({ name: "שם אחר לגמרי", title: slotLabel, now, expiresInDays: 365 }),
      );
    case "identity_conflict":
      return hydrateExtraction(
        baseFacts({
          name: workerName,
          identity: "111111118",
          title: slotLabel,
          now,
          expiresInDays: 365,
        }),
      );
    case "field_uncertain":
      return hydrateExtraction({
        ...baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }),
        document: {
          ...baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }).document,
          extensions: [
            {
              label: extractedValue("הרשאה", "certain"),
              value: extractedValue("על סולמות", "uncertain", [
                { id: "ev-ext", quoteHe: "על סול…", locationHint: "פינה מטושטשת" },
              ]),
            },
          ],
        },
      });
    case "expired_doc":
      return hydrateExtraction(
        baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: -1 }),
      );
    case "duplicate":
    case "certain_match":
      return hydrateExtraction(
        baseFacts({
          name: workerName,
          identity: "200000008",
          title: slotLabel,
          now,
          expiresInDays: 365,
        }),
      );
    case "unknown":
      return { ...hydrateExtraction(baseFacts({ name: workerName, title: slotLabel, now })), unclassified: true };
    case "processing_active":
      return hydrateExtraction(baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }));
    default:
      return hydrateExtraction(
        baseFacts({ name: workerName, title: slotLabel, now, expiresInDays: 365 }),
      );
  }
}
