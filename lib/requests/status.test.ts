import { describe, expect, it } from "vitest";
import type { ResolutionCase } from "../resolution/types";
import { getSubmissionPulse, pulseBucketForWorker } from "./status";
import type { RequestDocumentSubmission, RequestWorkerSubmission } from "./types";

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
