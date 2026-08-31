import { describe, expect, it } from "vitest";
import { createRequestSeed } from "../mock/requestSeed";
import type { RequestReuploadLink } from "../requests/types";
import { applyAnswer, evaluateWorker } from "./engine";
import type { ResolutionCase } from "./types";
import { emptyExtraction } from "./types";

const now = new Date("2026-08-30T12:00:00.000Z");

function openLinkFor(
  workerId: string,
  requestId: string,
  slotId: string,
  expiresAt: string,
): RequestReuploadLink {
  return {
    id: "ulink-1",
    token: "u-keep-open",
    requestId,
    workerSubmissionId: workerId,
    requestedDocumentId: slotId,
    expiresAt,
  };
}

describe("request resolution engine", () => {
  it("does not invent a missing problem for a draft", () => {
    const seed = createRequestSeed(now);
    const draft = {
      ...seed,
      workerSubmissions: [
        ...seed.workerSubmissions,
        {
          id: "w-draft",
          requestId: seed.requests[0].id,
          submittedFullName: "טיוטה",
          status: "draft" as const,
        },
      ],
    };
    const next = evaluateWorker(draft, "w-draft", now);
    expect(next.activity.some((entry) => entry.workerSubmissionId === "w-draft")).toBe(false);
  });

  it("keeps a reupload link open when a file arrived but still needs review", () => {
    const seed = createRequestSeed(now);
    const worker = seed.workerSubmissions.find((entry) => entry.id === "wsub-missing")!;
    const missingDoc = seed.documentSubmissions.find(
      (entry) => entry.workerSubmissionId === worker.id && entry.status === "missing",
    )!;
    const request = seed.requests.find((entry) => entry.id === worker.requestId)!;
    const reviewing = {
      ...missingDoc,
      sourceFileId: "file-reupload-1",
      status: "needs_review" as const,
      uploadedAt: now.toISOString(),
    };
    const docCase: ResolutionCase = {
      id: "case-reupload-review",
      requestId: worker.requestId,
      workerSubmissionId: worker.id,
      documentSubmissionId: reviewing.id,
      activityId: worker.activityId ?? worker.id,
      state: "waiting_for_user",
      extraction: { ...emptyExtraction, fileReadable: false },
      issues: [
        {
          id: "iss-unreadable",
          code: "file_unreadable",
          state: "open",
          evidence: [],
        },
      ],
      attempts: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const world = {
      ...seed,
      documentSubmissions: seed.documentSubmissions.map((entry) =>
        entry.id === reviewing.id ? reviewing : entry,
      ),
      cases: [...seed.cases, docCase],
      reuploadLinks: [openLinkFor(worker.id, worker.requestId, reviewing.requestedDocumentId, request.expiresAt)],
    };

    const next = evaluateWorker(world, worker.id, now);
    expect(next.reuploadLinks.find((entry) => entry.id === "ulink-1")?.resolvedAt).toBeUndefined();
  });

  it("closes a reupload link only after that document is accepted", () => {
    const seed = createRequestSeed(now);
    const worker = seed.workerSubmissions.find((entry) => entry.id === "wsub-missing")!;
    const missingDoc = seed.documentSubmissions.find(
      (entry) => entry.workerSubmissionId === worker.id && entry.status === "missing",
    )!;
    const request = seed.requests.find((entry) => entry.id === worker.requestId)!;
    const reviewing = {
      ...missingDoc,
      sourceFileId: "file-reupload-1",
      status: "needs_review" as const,
      uploadedAt: now.toISOString(),
    };
    const docCase: ResolutionCase = {
      id: "case-reupload-accept",
      requestId: worker.requestId,
      workerSubmissionId: worker.id,
      documentSubmissionId: reviewing.id,
      activityId: worker.activityId ?? worker.id,
      state: "waiting_for_user",
      extraction: emptyExtraction,
      issues: [
        {
          id: "iss-review",
          code: "unknown",
          state: "open",
          evidence: [],
        },
      ],
      attempts: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const world = {
      ...seed,
      documentSubmissions: seed.documentSubmissions.map((entry) =>
        entry.id === reviewing.id ? reviewing : entry,
      ),
      cases: [...seed.cases, docCase],
      reuploadLinks: [openLinkFor(worker.id, worker.requestId, reviewing.requestedDocumentId, request.expiresAt)],
    };

    const workerCase = world.cases.find(
      (entry) => entry.workerSubmissionId === worker.id && !entry.documentSubmissionId,
    )!;
    const afterWorkerAccept = applyAnswer(world, workerCase.id, { type: "accept_document" }, now).world;
    expect(
      afterWorkerAccept.reuploadLinks.find((entry) => entry.id === "ulink-1")?.resolvedAt,
    ).toBeUndefined();

    const accepted = applyAnswer(world, docCase.id, { type: "accept_document" }, now).world;
    expect(accepted.reuploadLinks.find((entry) => entry.id === "ulink-1")?.resolvedAt).toBeDefined();
  });
});
