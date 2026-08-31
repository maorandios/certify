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

export function publicRequestUrl(token: string): string {
  return `${origin()}/r/${token}`;
}

export function publicReuploadUrl(token: string): string {
  return `${origin()}/u/${token}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoShareUrl(input: { subject: string; body: string }): string {
  return `mailto:?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.body)}`;
}
