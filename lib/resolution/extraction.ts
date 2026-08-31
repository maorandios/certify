import type { ExtractedFields } from "../types";
import type {
  DocumentExtraction,
  EvidenceReference,
  ExtractedExtension,
  ExtractedValue,
  ExtractionResult,
  FieldCertainty,
} from "./types";

export const OPERATIONAL_EXTRACTION_KEYS = [
  "employee.fullName",
  "employee.identityNumber",
  "document.title",
  "document.validity",
  "fileReadable",
] as const;

export const OPTIONAL_EXTRACTION_KEYS = [
  "document.certificateNumber",
  "document.issuer",
  "document.performedAt",
] as const;

const FORBIDDEN_EXTRACTION_KEYS = [
  "actions",
  "buttons",
  "contentKind",
  "candidates",
  "openBehavior",
  "actionKind",
  "jsx",
  "component",
  "problemCode",
] as const;

export function missingExtractedValue<T>(): ExtractedValue<T> {
  return {
    value: null,
    certainty: "missing",
    evidence: [],
    source: "document",
  };
}

export function extractedValue<T>(
  value: T | null | undefined,
  certainty: FieldCertainty | undefined,
  evidence: EvidenceReference[] = [],
  source: ExtractedValue<T>["source"] = "document",
): ExtractedValue<T> {
  if (value == null || value === "") {
    return missingExtractedValue();
  }
  return {
    value,
    certainty: certainty ?? "certain",
    evidence,
    source,
  };
}

function evidenceFor(
  evidence: EvidenceReference[],
  field: string,
): EvidenceReference[] {
  return evidence.filter((entry) => entry.field === field);
}

export function emptyDocumentExtraction(): DocumentExtraction {
  return {
    employee: {
      fullName: missingExtractedValue(),
      identityNumber: missingExtractedValue(),
    },
    document: {
      title: missingExtractedValue(),
      certificateNumber: missingExtractedValue(),
      issuer: missingExtractedValue(),
      performedAt: missingExtractedValue(),
      validity: { mode: "unknown", reason: "date_not_found", evidence: [] },
      extensions: [],
    },
    fileReadable: true,
    evidence: [],
  };
}

export function toDocumentExtraction(
  extraction: ExtractionResult,
): DocumentExtraction {
  if (extraction.document) return extraction.document;
  const evidence = extraction.evidence;
  const fields = extraction.fields;
  const certainty = extraction.fieldCertainty;
  const extensions: ExtractedExtension[] = [];
  for (const permission of fields.permissionsHe ?? []) {
    extensions.push({
      label: extractedValue("הרשאה", "certain", []),
      value: extractedValue(
        permission,
        fields.uncertainFieldKeys?.includes("permissionsHe")
          ? "uncertain"
          : "certain",
        evidenceFor(evidence, "permissionsHe"),
      ),
    });
  }
  for (const restriction of fields.restrictionsHe ?? []) {
    extensions.push({
      label: extractedValue("הגבלה", "certain", []),
      value: extractedValue(
        restriction,
        fields.uncertainFieldKeys?.includes("restrictionsHe")
          ? "uncertain"
          : "certain",
        evidenceFor(evidence, "restrictionsHe"),
      ),
    });
  }
  return {
    employee: {
      fullName: extractedValue(
        fields.fullName,
        certainty.fullName,
        evidenceFor(evidence, "fullName"),
      ),
      identityNumber: extractedValue(
        fields.identityNumber,
        certainty.identityNumber,
        evidenceFor(evidence, "identityNumber"),
      ),
    },
    document: {
      title: extractedValue(
        fields.title,
        certainty.title,
        evidenceFor(evidence, "title"),
      ),
      certificateNumber: extractedValue(
        fields.credentialNumber,
        certainty.credentialNumber,
        evidenceFor(evidence, "credentialNumber"),
      ),
      issuer: extractedValue(
        fields.issuer,
        certainty.issuer,
        evidenceFor(evidence, "issuer"),
      ),
      performedAt: extractedValue(
        fields.issuedOn ?? fields.validFrom,
        certainty.issuedOn ?? certainty.validFrom,
        evidenceFor(evidence, "issuedOn"),
      ),
      validity: extraction.validity ?? {
        mode: "unknown",
        reason: "date_not_found",
        evidence: evidenceFor(evidence, "expiresOn"),
      },
      extensions,
    },
    fileReadable: extraction.fileReadable,
    evidence,
  };
}

export function fieldsFromDocument(
  document: DocumentExtraction,
): {
  fields: Partial<ExtractedFields>;
  fieldCertainty: Partial<Record<keyof ExtractedFields, FieldCertainty>>;
} {
  const fields: Partial<ExtractedFields> = {};
  const fieldCertainty: Partial<Record<keyof ExtractedFields, FieldCertainty>> =
    {};
  function apply<K extends keyof ExtractedFields>(
    key: K,
    entry: ExtractedValue<ExtractedFields[K] extends infer V ? V : never>,
  ) {
    if (entry.certainty === "missing" || entry.value == null) {
      fieldCertainty[key] = "missing";
      return;
    }
    fields[key] = entry.value as ExtractedFields[K];
    fieldCertainty[key] = entry.certainty;
  }
  apply("fullName", document.employee.fullName);
  apply("identityNumber", document.employee.identityNumber);
  apply("title", document.document.title);
  apply("credentialNumber", document.document.certificateNumber);
  apply("issuer", document.document.issuer);
  apply("issuedOn", document.document.performedAt);
  if (document.document.validity.mode === "dated") {
    fields.expiresOn = document.document.validity.expiresOn;
    fieldCertainty.expiresOn = document.document.validity.certainty;
  } else if (document.document.validity.mode === "unknown") {
    fieldCertainty.expiresOn = "missing";
  }
  const permissions = document.document.extensions
    .filter((entry) => entry.label.value === "הרשאה" && entry.value?.value)
    .map((entry) => entry.value!.value as string);
  if (permissions.length > 0) fields.permissionsHe = permissions;
  const restrictions = document.document.extensions
    .filter((entry) => entry.label.value === "הגבלה" && entry.value?.value)
    .map((entry) => entry.value!.value as string);
  if (restrictions.length > 0) fields.restrictionsHe = restrictions;
  return { fields, fieldCertainty };
}

export function hydrateExtraction(
  document: DocumentExtraction,
  extras?: {
    unclassified?: boolean;
  },
): ExtractionResult {
  const working = fieldsFromDocument(document);
  return {
    document,
    unclassified: extras?.unclassified,
    fileReadable: document.fileReadable,
    evidence: document.evidence,
    validity: document.document.validity,
    fields: working.fields,
    fieldCertainty: working.fieldCertainty,
  };
}

export function attachDocumentExtraction(
  extraction: ExtractionResult,
): ExtractionResult {
  const document = toDocumentExtraction(extraction);
  return { ...extraction, document };
}

export function extractionHasUiHints(value: object): boolean {
  return FORBIDDEN_EXTRACTION_KEYS.some((key) => key in value);
}

export function isOptionalExtractionKey(key: string): boolean {
  return (OPTIONAL_EXTRACTION_KEYS as readonly string[]).includes(key);
}

export function optionalFieldIsBlocking(
  certainty: FieldCertainty | undefined,
  changesMeaning: boolean,
): boolean {
  if (!certainty || certainty === "missing") return false;
  if (certainty === "uncertain") return changesMeaning;
  return false;
}
