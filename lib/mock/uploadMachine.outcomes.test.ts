import { describe, expect, it } from "vitest";
import { createSeed } from "./seed";
import { applyTargetedAssignment, applyUploadOutcome } from "./uploadMachine";
import type { MockUploadOutcome, UploadJob } from "../types";

const now = new Date("2026-08-27T12:00:00.000Z");

function makeJob(): UploadJob {
  return {
    id: "job-test",
    stage: "matching",
    fileMeta: {
      name: "upload.jpg",
      mime: "image/jpeg",
      sizeLabel: "1.0 MB",
      previewKind: "image",
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function run(outcome: MockUploadOutcome) {
  const seed = createSeed(now);
  return applyUploadOutcome({
    employees: seed.employees,
    documents: seed.documents,
    job: makeJob(),
    outcome,
    now,
  });
}

describe("simulated upload outcomes", () => {
  it("employee_not_found parks the job and asks to create an employee", () => {
    const result = run("employee_not_found");
    expect(result.job.stage).toBe("action_required");
    expect(result.activity[0].actionKind).toBe("create_employee");
    expect(result.activity[0].jobId).toBe("job-test");
  });

  it("ambiguous_employee offers candidate employees", () => {
    const result = run("ambiguous_employee");
    expect(result.job.stage).toBe("action_required");
    expect(result.activity[0].actionKind).toBe("select_employee");
    expect(result.activity[0].candidateEmployeeIds?.length).toBeGreaterThan(1);
  });

  it("uncertain_field stores a needs_review document for the matched employee", () => {
    const result = run("uncertain_field");
    const seed = createSeed(now);
    expect(result.documents.length).toBe(seed.documents.length + 1);
    const pending = result.documents.find((doc) => doc.id === "doc-job-test");
    expect(pending?.lifecycle).toBe("needs_review");
    expect(result.activity[0].actionKind).toBe("confirm_field");
  });

  it("unreadable_file fails the job with a replace_file action", () => {
    const result = run("unreadable_file");
    expect(result.job.stage).toBe("failed");
    expect(result.activity[0].actionKind).toBe("replace_file");
  });

  it("exact_duplicate saves nothing and posts an informational update", () => {
    const seed = createSeed(now);
    const result = run("exact_duplicate");
    expect(result.documents.length).toBe(seed.documents.length);
    expect(result.job.stage).toBe("completed");
    expect(result.activity[0].type).toBe("update");
  });

  it("possible_duplicate keeps a pending document and asks for a decision", () => {
    const result = run("possible_duplicate");
    expect(result.job.stage).toBe("action_required");
    expect(result.activity[0].actionKind).toBe("confirm_replacement");
    expect(result.activity[0].pendingDocumentId).toBe("doc-job-test");
  });

  it("certain_replacement supersedes the previous document automatically", () => {
    const result = run("certain_replacement");
    const old = result.documents.find((doc) => doc.id === "doc-maria-operator");
    const fresh = result.documents.find((doc) => doc.id === "doc-job-test");
    expect(old?.lifecycle).toBe("superseded");
    expect(fresh?.lifecycle).toBe("active");
    expect(result.job.stage).toBe("completed");
  });

  it("uncertain_replacement waits for a replace-or-keep decision", () => {
    const result = run("uncertain_replacement");
    expect(result.job.stage).toBe("action_required");
    expect(result.activity[0].actionKind).toBe("confirm_replacement");
    expect(result.activity[0].documentId).toBe("doc-mohammad-height");
  });
});

describe("targeted assignment (request/employee uploads)", () => {
  it("replaces the targeted document and activates the new one", () => {
    const seed = createSeed(now);
    const result = applyTargetedAssignment({
      employees: seed.employees,
      documents: seed.documents,
      job: makeJob(),
      target: {
        employeeId: "emp-daniel",
        replacesDocumentId: "doc-daniel-license",
      },
      now,
    });
    const old = result.documents.find((doc) => doc.id === "doc-daniel-license");
    const fresh = result.documents.find((doc) => doc.id === "doc-job-test");
    expect(old?.lifecycle).toBe("superseded");
    expect(fresh?.lifecycle).toBe("active");
    expect(fresh?.typeId).toBe("professional");
    expect(result.job.assignedEmployeeId).toBe("emp-daniel");
  });
});
