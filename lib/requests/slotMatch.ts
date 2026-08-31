import type { EvidenceReference } from "../resolution/types";
import type { RequestedSlotMatch } from "./types";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\u0590-\u05FFa-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalize(value).split(" ").filter((token) => token.length > 1);
}

export function matchRequestedSlot(input: {
  requestedLabel: string;
  extractedDocumentTitle?: string | null;
  evidence?: EvidenceReference[];
}): RequestedSlotMatch {
  const requestedLabel = input.requestedLabel.trim();
  const extracted = input.extractedDocumentTitle?.trim() || undefined;
  const evidence = input.evidence ?? [];

  if (!extracted) {
    return {
      result: "uncertain",
      requestedLabel,
      evidence,
    };
  }

  const requestedNorm = normalize(requestedLabel);
  const extractedNorm = normalize(extracted);
  if (requestedNorm === extractedNorm) {
    return { result: "match", requestedLabel, extractedDocumentTitle: extracted, evidence };
  }
  if (
    requestedNorm.includes(extractedNorm) ||
    extractedNorm.includes(requestedNorm)
  ) {
    return { result: "match", requestedLabel, extractedDocumentTitle: extracted, evidence };
  }

  const left = new Set(tokens(requestedLabel));
  const right = tokens(extracted);
  const overlap = right.filter((token) => left.has(token)).length;
  const needed = Math.min(2, Math.max(1, Math.floor(left.size / 2)));
  if (overlap >= needed) {
    return { result: "match", requestedLabel, extractedDocumentTitle: extracted, evidence };
  }

  return {
    result: "mismatch",
    requestedLabel,
    extractedDocumentTitle: extracted,
    evidence,
  };
}
