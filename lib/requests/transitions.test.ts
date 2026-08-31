import { describe, expect, it } from "vitest";
import type { DocumentRequest, RequestReuploadLink } from "./types";
import {
  canReopenRequest,
  extendRequestExpiry,
  isReuploadLinkOpen,
  reopenRequest,
} from "./transitions";

const now = new Date("2026-08-30T12:00:00.000Z");

function request(patch: Partial<DocumentRequest> = {}): DocumentRequest {
  return {
    id: "req-1",
    title: "בדיקה",
    recipient: { name: "דניאל" },
    requestedDocuments: [],
    expiresAt: "2026-09-10T12:00:00.000Z",
    status: "closed",
    token: "r-abc",
    createdAt: "2026-08-01T12:00:00.000Z",
    messageHe: "",
    ...patch,
  };
}

describe("request transition guards", () => {
  it("reopens a closed request only while expiry is in the future", () => {
    expect(canReopenRequest(request(), now)).toBe(true);
    const opened = reopenRequest(request(), now);
    expect("error" in opened).toBe(false);
    expect(canReopenRequest(request({ expiresAt: "2026-08-01T12:00:00.000Z" }), now)).toBe(false);
    expect(reopenRequest(request({ expiresAt: "2026-08-01T12:00:00.000Z" }), now)).toEqual({
      error: "expiry_passed",
    });
  });

  it("does not reopen a revoked request", () => {
    expect(reopenRequest(request({ status: "revoked" }), now)).toEqual({ error: "revoked" });
    expect(extendRequestExpiry(request({ status: "revoked" }), "2026-10-01T12:00:00.000Z", now)).toEqual({
      error: "revoked",
    });
  });

  it("extends an expired request back to active", () => {
    const next = extendRequestExpiry(
      request({ status: "expired", expiresAt: "2026-08-01T12:00:00.000Z" }),
      "2026-10-01T12:00:00.000Z",
      now,
    );
    expect("error" in next).toBe(false);
    if (!("error" in next)) {
      expect(next.status).toBe("active");
      expect(next.expiresAt).toBe("2026-10-01T12:00:00.000Z");
    }
  });

  it("keeps a reupload link open until the document is accepted", () => {
    const link: RequestReuploadLink = {
      id: "u1",
      token: "u-token",
      requestId: "req-1",
      workerSubmissionId: "w1",
      requestedDocumentId: "slot-1",
      expiresAt: "2026-09-10T12:00:00.000Z",
    };
    expect(isReuploadLinkOpen(link, request({ status: "active" }), now)).toBe(true);
    expect(
      isReuploadLinkOpen(
        { ...link, resolvedAt: now.toISOString() },
        request({ status: "active" }),
        now,
      ),
    ).toBe(false);
  });
});
