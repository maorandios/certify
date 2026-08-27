import { describe, expect, it } from "vitest";
import { createSeed } from "./seed";
import {
  applyHappyPathAssignment,
  buildHappyPathExtraction,
  nextStage,
} from "./uploadMachine";
import { getEmployeeDocumentStatus } from "../status";

describe("upload machine", () => {
  it("advances processing stages until completion", () => {
    expect(nextStage("reading")).toBe("identifying");
    expect(nextStage("identifying")).toBe("extracting");
    expect(nextStage("extracting")).toBe("matching");
    expect(nextStage("matching")).toBe("completed");
    expect(nextStage("completed")).toBeNull();
  });

  it("assigns a document and supersedes the previous active certification", () => {
    const seed = createSeed(new Date("2026-08-27T12:00:00.000Z"));
    const now = new Date("2026-08-27T12:00:00.000Z");
    const result = applyHappyPathAssignment({
      employees: seed.employees,
      documents: seed.documents,
      now,
      job: {
        id: "job-1",
        stage: "matching",
        fileMeta: {
          name: "new-height.jpg",
          mime: "image/jpeg",
          sizeLabel: "1.0 MB",
          previewKind: "image",
        },
        extracted: buildHappyPathExtraction(now),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });

    const yosefDocs = result.documents.filter(
      (document) => document.employeeId === "emp-yosef",
    );
    const activeHeight = yosefDocs.filter(
      (document) =>
        document.typeId === "height_work" && document.lifecycle === "active",
    );
    const supersededHeight = yosefDocs.filter(
      (document) =>
        document.typeId === "height_work" &&
        document.lifecycle === "superseded",
    );

    expect(activeHeight).toHaveLength(1);
    expect(supersededHeight).toHaveLength(1);
    expect(result.replaced).toBe(true);
    expect(result.job.assignedEmployeeId).toBe("emp-yosef");

    const yosef = seed.employees.find((employee) => employee.id === "emp-yosef");
    expect(yosef).toBeTruthy();
    expect(
      getEmployeeDocumentStatus(yosef!, result.documents, now),
    ).toBe("current");
  });
});
