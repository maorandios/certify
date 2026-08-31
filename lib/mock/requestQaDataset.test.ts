import { describe, expect, it } from "vitest";
import { createRequestQaDataset, REQUEST_QA_SCENARIO_IDS } from "./requestQaDataset";
import { isSubmittedWorker } from "../requests/status";

const now = new Date("2026-08-30T12:00:00.000Z");

describe("request QA dataset", () => {
  it("contains each scenario id at most once on activities", () => {
    const dataset = createRequestQaDataset(now);
    const ids = dataset.activity
      .map((entry) => entry.qaScenarioId)
      .filter((value): value is string => Boolean(value));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(REQUEST_QA_SCENARIO_IDS).toContain(id);
    }
  });

  it("does not create a feed post for an abandoned draft", () => {
    const dataset = createRequestQaDataset(now);
    const draft = dataset.workerSubmissions.find((entry) => entry.id === "qa-wsub-draft");
    expect(draft?.status).toBe("draft");
    expect(draft?.activityId).toBeUndefined();
    expect(dataset.activity.some((entry) => entry.workerSubmissionId === draft?.id)).toBe(false);
    expect(
      dataset.cases.some(
        (entry) =>
          entry.workerSubmissionId === draft?.id &&
          entry.issues.some((issue) => issue.code === "requested_document_missing"),
      ),
    ).toBe(false);
  });

  it("creates missing issues only after submit", () => {
    const dataset = createRequestQaDataset(now);
    const missing = dataset.workerSubmissions.find((entry) => entry.id === "qa-wsub-missing");
    expect(missing && isSubmittedWorker(missing)).toBe(true);
    const issues = dataset.cases
      .filter((entry) => entry.workerSubmissionId === missing?.id)
      .flatMap((entry) => entry.issues);
    expect(issues.some((issue) => issue.code === "requested_document_missing")).toBe(true);
  });

  it("keeps one activity per submitted worker", () => {
    const dataset = createRequestQaDataset(now);
    const submitted = dataset.workerSubmissions.filter(isSubmittedWorker);
    for (const worker of submitted) {
      const posts = dataset.activity.filter((entry) => entry.workerSubmissionId === worker.id);
      expect(posts.length).toBeLessThanOrEqual(1);
    }
  });

  it("resets to the same snapshot for a fixed now", () => {
    const a = createRequestQaDataset(now);
    const b = createRequestQaDataset(now);
    expect(a.requests.map((entry) => entry.id)).toEqual(b.requests.map((entry) => entry.id));
    expect(a.activity.map((entry) => entry.id)).toEqual(b.activity.map((entry) => entry.id));
  });
});
