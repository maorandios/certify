import { publicReuploadUrl, publicRequestUrl } from "../links";
import type { DocumentRequest, RequestedDocument } from "./types";

export function buildRequestMessageHe(input: {
  title: string;
  recipientName: string;
  documents: Array<Pick<RequestedDocument, "label">>;
  url: string;
}): string {
  const firstName = input.recipientName.split(" ")[0] || input.recipientName;
  const list = input.documents.map((doc) => `• ${doc.label}`).join("\n");
  return `שלום ${firstName}, מצורפת בקשת מסמכים: ${input.title}.\n${list}\nאפשר להעלות בקישור: ${input.url}`;
}

export function requestShareUrl(request: Pick<DocumentRequest, "token">): string {
  return publicRequestUrl(request.token);
}

export function buildReuploadMessageHe(input: {
  recipientName: string;
  workerName: string;
  slotLabel: string;
  url: string;
}): string {
  const firstName = input.recipientName.split(" ")[0] || input.recipientName;
  return `שלום ${firstName}, נדרש קובץ מעודכן עבור ${input.workerName} — ${input.slotLabel}. קישור להעלאה: ${input.url}`;
}

export function reuploadShareUrl(token: string): string {
  return publicReuploadUrl(token);
}
