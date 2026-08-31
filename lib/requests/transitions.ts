import type { DocumentRequest, RequestReuploadLink } from "./types";

export function isRequestExpired(request: DocumentRequest, now = new Date()): boolean {
  return new Date(request.expiresAt).getTime() <= now.getTime();
}

export function canReopenRequest(request: DocumentRequest, now = new Date()): boolean {
  return request.status === "closed" && !isRequestExpired(request, now);
}

export function canExtendRequest(request: DocumentRequest): boolean {
  return request.status === "active" || request.status === "expired" || request.status === "closed";
}

export function canRevokeRequest(request: DocumentRequest): boolean {
  return request.status === "active" || request.status === "expired" || request.status === "closed";
}

export function applyRequestExpiry(request: DocumentRequest, now = new Date()): DocumentRequest {
  if (request.status === "active" && isRequestExpired(request, now)) {
    return { ...request, status: "expired" };
  }
  return request;
}

export function extendRequestExpiry(
  request: DocumentRequest,
  expiresAt: string,
  now = new Date(),
): DocumentRequest | { error: "revoked" | "invalid_expiry" } {
  if (request.status === "revoked") return { error: "revoked" };
  if (!canExtendRequest(request)) return { error: "invalid_expiry" };
  if (new Date(expiresAt).getTime() <= now.getTime()) return { error: "invalid_expiry" };
  if (request.status === "expired") {
    return { ...request, expiresAt, status: "active" };
  }
  return { ...request, expiresAt };
}

export function reopenRequest(
  request: DocumentRequest,
  now = new Date(),
): DocumentRequest | { error: "revoked" | "expiry_passed" | "not_closed" } {
  if (request.status === "revoked") return { error: "revoked" };
  if (request.status !== "closed") return { error: "not_closed" };
  if (isRequestExpired(request, now)) return { error: "expiry_passed" };
  return { ...request, status: "active", closedAt: undefined };
}

export function isReuploadLinkOpen(
  link: RequestReuploadLink,
  request: DocumentRequest | undefined,
  now = new Date(),
): boolean {
  if (!request) return false;
  if (link.revokedAt || link.resolvedAt) return false;
  if (new Date(link.expiresAt).getTime() <= now.getTime()) return false;
  if (request.status !== "active") return false;
  if (isRequestExpired(request, now)) return false;
  return true;
}
