import type { DocumentValidity } from "../types";
import type { ExtractionResult } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const NO_EXPIRY_PHRASES = [
  "ללא הגבלת זמן",
  "אין תאריך תפוגה",
  "בתוקף ללא הגבלה",
  "ללא תוקף",
];

export function isValidIsoDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const time = new Date(`${value}T12:00:00`).getTime();
  return Number.isFinite(time);
}

function noExpiryEvidence(extraction: ExtractionResult) {
  return extraction.evidence.filter(
    (entry) =>
      Boolean(entry.quoteHe) &&
      NO_EXPIRY_PHRASES.some((phrase) => entry.quoteHe!.includes(phrase)),
  );
}

function dateEvidence(extraction: ExtractionResult) {
  return extraction.evidence.filter((entry) => entry.field === "expiresOn");
}

/** Derive validity from document facts only. Missing date is not no_expiry. */
export function deriveDocumentValidity(
  extraction: ExtractionResult,
): DocumentValidity {
  if (extraction.validity) return extraction.validity;

  const explicitNone = noExpiryEvidence(extraction);
  const dates = dateEvidence(extraction);
  const expiresOn = extraction.fields.expiresOn;
  const certainty = extraction.fieldCertainty.expiresOn;
  const quotes = dates
    .map((entry) => entry.quoteHe)
    .filter((value): value is string => Boolean(value));
  const conflicting =
    quotes.length >= 2 && new Set(quotes.map((value) => value.replace(/\s/g, ""))).size > 1;

  if (conflicting) {
    return { mode: "unknown", reason: "conflicting_dates", evidence: dates };
  }

  if (explicitNone.length > 0 && !expiresOn) {
    return {
      mode: "no_expiry",
      certainty: "certain",
      evidence: explicitNone,
    };
  }

  if (certainty === "certain" && isValidIsoDate(expiresOn)) {
    return {
      mode: "dated",
      expiresOn,
      certainty: "certain",
      evidence: dates,
    };
  }

  if (certainty === "uncertain" && isValidIsoDate(expiresOn)) {
    return {
      mode: "dated",
      expiresOn,
      certainty: "uncertain",
      evidence: dates,
    };
  }

  if (certainty === "uncertain" || dates.some((entry) => entry.quoteHe)) {
    return { mode: "unknown", reason: "date_unreadable", evidence: dates };
  }

  return { mode: "unknown", reason: "date_not_found", evidence: dates };
}

export function validityNeedsReview(validity: DocumentValidity): boolean {
  return (
    validity.mode === "unknown" ||
    (validity.mode === "dated" && validity.certainty === "uncertain")
  );
}

export function applyValidityToExtraction(
  extraction: ExtractionResult,
  validity: DocumentValidity,
): ExtractionResult {
  if (validity.mode === "dated") {
    return {
      ...extraction,
      validity,
      fields: { ...extraction.fields, expiresOn: validity.expiresOn },
      fieldCertainty: {
        ...extraction.fieldCertainty,
        expiresOn: validity.certainty,
      },
    };
  }
  if (validity.mode === "no_expiry") {
    const fields = { ...extraction.fields };
    delete fields.expiresOn;
    return {
      ...extraction,
      validity,
      fields,
      fieldCertainty: {
        ...extraction.fieldCertainty,
        expiresOn: "certain",
      },
    };
  }
  return { ...extraction, validity };
}

export function isDatedExpired(expiresOn: string, now = new Date()): boolean {
  return new Date(`${expiresOn}T23:59:59`).getTime() < now.getTime();
}
