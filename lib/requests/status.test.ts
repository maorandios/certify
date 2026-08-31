import { describe, expect, it } from "vitest";
import type { ResolutionCase } from "../resolution/types";
import { eventListStatus, getSubmissionPulse, pulseBucketForWorker } from "./status";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  RequestWorkerSubmission,
} from "./types";

function worker(patch: Partial<RequestWorkerSubmission>): RequestWorkerSubmission {
  return {
    id: "w1",
    requestId: "r1",
    submittedFullName: "יוסף",
    status: "needs_review",
    submittedAt: "2026-08-30T10:00:00.000Z",
    ...patch,
  };
}

function doc(patch: Partial<RequestDocumentSubmission>): RequestDocumentSubmission {
  return {
    id: "d1",
    requestId: "r1",
    workerSubmissionId: "w1",
    requestedDocumentId: "s1",
    status: "missing",
    ...patch,
  };
}

describe("submission pulse", () => {
  it("ignores drafts and empty requests", () => {
    const draft = worker({ status: "draft", submittedAt: undefined });
    expect(pulseBucketForWorker(draft, [], [])).toBeNull();
    expect(getSubmissionPulse([draft], [], []).submitted).toBe(0);
  });

  it("counts complete and approved together", () => {
    const pulse = getSubmissionPulse(
      [worker({ status: "complete" }), worker({ id: "w2", status: "approved" })],
      [],
      [],
    );
    expect(pulse.complete).toBe(2);
    expect(pulse.needsReview).toBe(0);
  });

  it("puts missing-only submissions in waiting", () => {
    const cases: ResolutionCase[] = [
      {
        id: "c1",
        requestId: "r1",
        workerSubmissionId: "w1",
        activityId: "a1",
        state: "waiting_for_user",
        extraction: { fields: {}, fieldCertainty: {}, fileReadable: true, evidence: [] },
        issues: [
          {
            id: "i1",
            code: "requested_document_missing",
            state: "open",
            evidence: [],
          },
        ],
        attempts: [],
        createdAt: "",
        updatedAt: "",
      },
    ];
    expect(pulseBucketForWorker(worker({ status: "processing" }), [doc({})], cases)).toBe("waiting");
  });
});

function request(patch: Partial<DocumentRequest> = {}): DocumentRequest {
  return {
    id: "r1",
    title: "אירוע",
    recipient: { name: "דני" },
    requestedDocuments: [],
    expiresAt: "2026-10-01T00:00:00.000Z",
    status: "active",
    token: "t",
    createdAt: "2026-08-01T00:00:00.000Z",
    messageHe: "",
    ...patch,
  };
}

describe("event list status", () => {
  const now = new Date("2026-08-31T12:00:00.000Z");

  it("maps revoked to cancelled and closed to completed", () => {
    expect(eventListStatus(request({ status: "revoked" }), [], now)).toBe("cancelled");
    expect(eventListStatus(request({ status: "closed" }), [], now)).toBe("completed");
  });

  it("treats events without submissions as open", () => {
    expect(eventListStatus(request({ status: "active" }), [], now)).toBe("open");
    expect(
      eventListStatus(request({ status: "expired", expiresAt: "2026-08-01T00:00:00.000Z" }), [], now),
    ).toBe("open");
  });

  it("treats events with submitted workers as in progress", () => {
    expect(eventListStatus(request(), [worker({ requestId: "r1" })], now)).toBe("in_progress");
    expect(
      eventListStatus(request(), [worker({ requestId: "r1", status: "draft", submittedAt: undefined })], now),
    ).toBe("open");
  });
});
