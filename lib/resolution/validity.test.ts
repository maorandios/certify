import { describe, expect, it } from "vitest";
import { deriveDocumentValidity } from "./validity";
import type { ExtractionResult } from "./types";

function extraction(patch: Partial<ExtractionResult>): ExtractionResult {
  return {
    fields: {},
    fieldCertainty: {},
    fileReadable: true,
    evidence: [],
    ...patch,
  };
}

describe("deriveDocumentValidity", () => {
  it("treats a certain valid date as dated", () => {
    const validity = deriveDocumentValidity(
      extraction({
        fields: { expiresOn: "2027-08-01" },
        fieldCertainty: { expiresOn: "certain" },
      }),
    );
    expect(validity).toEqual({
      mode: "dated",
      expiresOn: "2027-08-01",
      certainty: "certain",
      evidence: [],
    });
  });

  it("treats an uncertain parsed date as dated uncertain", () => {
    const validity = deriveDocumentValidity(
      extraction({
        fields: { expiresOn: "2027-08-01" },
        fieldCertainty: { expiresOn: "uncertain" },
        evidence: [{ id: "e1", field: "expiresOn", quoteHe: "08/27 מטושטש" }],
      }),
    );
    expect(validity.mode).toBe("dated");
    if (validity.mode === "dated") {
      expect(validity.certainty).toBe("uncertain");
    }
  });

  it("does not treat a missing date as no_expiry", () => {
    const validity = deriveDocumentValidity(
      extraction({
        fields: { fullName: "יוסף לוי" },
        fieldCertainty: { fullName: "certain" },
      }),
    );
    expect(validity).toEqual({
      mode: "unknown",
      reason: "date_not_found",
      evidence: [],
    });
  });

  it("allows no_expiry only with explicit evidence", () => {
    const validity = deriveDocumentValidity(
      extraction({
        fields: { fullName: "יוסף לוי" },
        evidence: [
          { id: "e1", field: "expiresOn", quoteHe: "ללא הגבלת זמן" },
        ],
      }),
    );
    expect(validity.mode).toBe("no_expiry");
    if (validity.mode === "no_expiry") {
      expect(validity.certainty).toBe("certain");
    }
  });

  it("marks an unreadable date as unknown", () => {
    const validity = deriveDocumentValidity(
      extraction({
        fieldCertainty: { expiresOn: "uncertain" },
        evidence: [
          { id: "e1", field: "expiresOn", quoteHe: "בתוקף עד: לא אותר" },
        ],
      }),
    );
    expect(validity).toMatchObject({
      mode: "unknown",
      reason: "date_unreadable",
    });
  });
});
