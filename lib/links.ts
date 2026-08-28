export function makeToken(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${random}`;
}

function origin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function publicShareUrl(token: string): string {
  return `${origin()}/s/${token}`;
}

export function publicRequestUrl(token: string): string {
  return `${origin()}/r/${token}`;
}

export function buildRenewMessageHe(input: {
  employeeName: string;
  documentTitle: string;
  url: string;
  expired: boolean;
}): string {
  const firstName = input.employeeName.split(" ")[0];
  const state = input.expired ? "פג" : "עומד לפוג";
  return `שלום ${firstName}, ${input.documentTitle} המשויך אליך ${state}. ניתן לצלם או להעלות אישור חדש בקישור הבא: ${input.url}`;
}
