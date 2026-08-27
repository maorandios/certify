const DAY_MS = 24 * 60 * 60 * 1000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

export function isoDaysFrom(from: Date, days: number): string {
  return toIsoDate(addDays(from, days));
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function daysUntil(isoDate: string, now = new Date()): number {
  const target = parseIsoDate(isoDate).getTime();
  const today = parseIsoDate(toIsoDate(now)).getTime();
  return Math.round((target - today) / DAY_MS);
}

export function formatHeDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDotDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function maskIdentity(identityNumber: string): string {
  return identityNumber.slice(-4);
}

export function formatRelativeHe(isoTimestamp: string, now = new Date()): string {
  const then = new Date(isoTimestamp).getTime();
  const diffMin = Math.round((now.getTime() - then) / 60000);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.round(hours / 24);
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(isoTimestamp).toLocaleDateString("he-IL");
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
