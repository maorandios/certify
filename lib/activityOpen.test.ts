import { describe, expect, it } from "vitest";
import {
  activityHasChevron,
  inferOpenBehavior,
  isActivityInteractive,
  resolveActivityOpen,
  resolveOpenBehavior,
  stampActivity,
} from "./activityOpen";
import { APP_STORE_VERSION } from "./store";
import { createSeed } from "./mock/seed";
import { buildProcessingActivity } from "./activity";
import type { ActivityItem, ActivityOpenBehavior, UploadJob } from "./types";

const now = new Date("2026-08-27T12:00:00.000Z");

function ctxFromSeed() {
  const seed = createSeed(now);
  return {
    seed,
    ctx: {
      employees: seed.employees,
      documents: seed.documents,
      jobs: seed.jobs,
    },
  };
}

function item(
  patch: Partial<ActivityItem> & Pick<ActivityItem, "id" | "openBehavior">,
): ActivityItem {
  return {
    type: "update",
    titleHe: "פריט",
    timestamp: now.toISOString(),
    ...patch,
  };
}

describe("activity open behavior", () => {
  it("covers every seeded destination", () => {
    const { seed, ctx } = ctxFromSeed();
    const byId = Object.fromEntries(seed.activity.map((entry) => [entry.id, entry]));

    expect(resolveOpenBehavior(byId["act-fatima-date"], ctx)).toBe("action_sheet");
    expect(resolveActivityOpen(byId["act-fatima-date"], ctx).type).toBe(
      "action_sheet",
    );

    expect(resolveOpenBehavior(byId["act-select-levi"], ctx)).toBe("action_sheet");
    expect(resolveActivityOpen(byId["act-select-levi"], ctx).type).toBe(
      "action_sheet",
    );

    expect(resolveOpenBehavior(byId["act-create-karim"], ctx)).toBe("action_sheet");
    expect(resolveActivityOpen(byId["act-create-karim"], ctx)).toEqual({
      type: "create_employee",
      item: byId["act-create-karim"],
    });

    expect(resolveOpenBehavior(byId["act-daniel-expired"], ctx)).toBe(
      "document_viewer",
    );
    expect(resolveActivityOpen(byId["act-daniel-expired"], ctx)).toEqual({
      type: "document_viewer",
      documentId: "doc-daniel-license",
    });

    expect(resolveOpenBehavior(byId["act-avigail-replaced"], ctx)).toBe(
      "document_viewer",
    );

    expect(resolveOpenBehavior(byId["act-viktor-long"], ctx)).toBe(
      "employee_details",
    );
    expect(resolveActivityOpen(byId["act-viktor-long"], ctx)).toEqual({
      type: "employee_details",
      employeeId: "emp-viktor",
    });

    expect(resolveOpenBehavior(byId["act-batch"], ctx)).toBe("result_list");
    expect(resolveActivityOpen(byId["act-batch"], ctx).type).toBe("result_list");

    expect(resolveOpenBehavior(byId["act-roi"], ctx)).toBe("none");
    expect(resolveActivityOpen(byId["act-roi"], ctx)).toEqual({ type: "none" });
    expect(isActivityInteractive(byId["act-roi"], ctx)).toBe(false);
    expect(activityHasChevron(byId["act-roi"], ctx)).toBe(false);
  });

  it("opens a processing post on the jobs sheet and focuses the job", () => {
    const job: UploadJob = {
      id: "job-live",
      stage: "extracting",
      fileMeta: {
        name: "scan.jpg",
        mime: "image/jpeg",
        sizeLabel: "1 MB",
        previewKind: "image",
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const processing = buildProcessingActivity([job]);
    expect(processing?.openBehavior).toBe("jobs_sheet");
    const intent = resolveActivityOpen(processing!, {
      employees: [],
      documents: [],
      jobs: [job],
    });
    expect(intent).toEqual({ type: "jobs_sheet", jobId: "job-live" });
  });

  it("treats a completed job as its resulting document", () => {
    const { ctx } = ctxFromSeed();
    const job: UploadJob = {
      id: "job-done",
      stage: "completed",
      assignedDocumentId: "doc-avigail-new",
      assignedEmployeeId: "emp-avigail",
      fileMeta: {
        name: "scan.jpg",
        mime: "image/jpeg",
        sizeLabel: "1 MB",
        previewKind: "image",
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const processing = item({
      id: "act-done",
      type: "processing",
      openBehavior: "jobs_sheet",
      jobId: "job-done",
    });
    expect(
      resolveOpenBehavior(processing, { ...ctx, jobs: [job] }),
    ).toBe("document_viewer");
    expect(
      resolveActivityOpen(processing, { ...ctx, jobs: [job] }),
    ).toEqual({ type: "document_viewer", documentId: "doc-avigail-new" });
  });

  it("guards missing targets so invalid items are not interactive", () => {
    const { ctx } = ctxFromSeed();

    expect(
      resolveOpenBehavior(
        item({
          id: "missing-doc",
          openBehavior: "document_viewer",
          documentId: "doc-missing",
        }),
        ctx,
      ),
    ).toBe("none");

    expect(
      resolveOpenBehavior(
        item({
          id: "missing-emp",
          openBehavior: "employee_details",
          employeeId: "emp-missing",
        }),
        ctx,
      ),
    ).toBe("none");

    expect(
      resolveOpenBehavior(
        item({
          id: "missing-job",
          openBehavior: "jobs_sheet",
          jobId: "job-missing",
        }),
        ctx,
      ),
    ).toBe("none");

    expect(
      resolveOpenBehavior(
        item({
          id: "sheet-without-kind",
          openBehavior: "action_sheet",
        }),
        ctx,
      ),
    ).toBe("none");

    expect(
      resolveOpenBehavior(
        item({
          id: "empty-list",
          openBehavior: "result_list",
          relatedDocumentIds: ["doc-missing"],
        }),
        ctx,
      ),
    ).toBe("none");
  });

  it("opens a single remaining result-list document directly", () => {
    const { ctx } = ctxFromSeed();
    const single = item({
      id: "one-result",
      openBehavior: "result_list",
      relatedDocumentIds: ["doc-avigail-new", "doc-missing"],
    });
    expect(resolveOpenBehavior(single, ctx)).toBe("document_viewer");
    expect(resolveActivityOpen(single, ctx)).toEqual({
      type: "document_viewer",
      documentId: "doc-avigail-new",
    });
  });

  it("shows a chevron only when the destination is valid", () => {
    const { seed, ctx } = ctxFromSeed();
    const interactive = seed.activity.filter((entry) =>
      isActivityInteractive(entry, ctx),
    );
    const inert = seed.activity.filter(
      (entry) => !isActivityInteractive(entry, ctx),
    );

    expect(interactive.length).toBeGreaterThan(0);
    expect(inert.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["act-roi", "act-cycle-link"]),
    );
    for (const entry of interactive) {
      expect(activityHasChevron(entry, ctx)).toBe(true);
    }
    for (const entry of inert) {
      expect(activityHasChevron(entry, ctx)).toBe(false);
    }
  });

  it("routes decision, document, employee, and inert posts without inline actions", () => {
    const { seed, ctx } = ctxFromSeed();
    const fatima = seed.activity.find((entry) => entry.id === "act-fatima-date")!;
    const daniel = seed.activity.find((entry) => entry.id === "act-daniel-expired")!;
    const salah = seed.activity.find((entry) => entry.id === "act-salah-long")!;
    const roi = seed.activity.find((entry) => entry.id === "act-roi")!;

    expect(resolveActivityOpen(fatima, ctx).type).toBe("action_sheet");
    expect(resolveActivityOpen(daniel, ctx).type).toBe("document_viewer");
    expect(resolveActivityOpen(salah, ctx).type).toBe("employee_details");
    expect(resolveActivityOpen(roi, ctx).type).toBe("none");
    expect(isActivityInteractive(roi, ctx)).toBe(false);
  });

  it("opens replace_file as the upload composer, not a sheet", () => {
    const replace = stampActivity({
      id: "act-replace",
      type: "action",
      titleHe: "הקובץ לא נקרא",
      timestamp: now.toISOString(),
      actionKind: "replace_file",
    });
    expect(replace.openBehavior).toBe("action_sheet");
    expect(
      resolveActivityOpen(replace, {
        employees: [],
        documents: [],
        jobs: [],
      }),
    ).toEqual({ type: "replace_file", item: replace });
  });

  it("infers destinations without relying on the visible activity type", () => {
    expect(
      inferOpenBehavior({
        id: "a",
        type: "alert",
        titleHe: "פג",
        timestamp: now.toISOString(),
        documentId: "doc-1",
      }),
    ).toBe("document_viewer");
    expect(
      inferOpenBehavior({
        id: "b",
        type: "update",
        titleHe: "עובד",
        timestamp: now.toISOString(),
        employeeId: "emp-1",
      }),
    ).toBe("employee_details");
    expect(
      inferOpenBehavior({
        id: "c",
        type: "update",
        titleHe: "כמה",
        timestamp: now.toISOString(),
        relatedDocumentIds: ["d1", "d2"],
      }),
    ).toBe("result_list");
  });

  it("bumps persisted store version so old localStorage resets to seed", () => {
    expect(APP_STORE_VERSION).toBe(10);
    const { seed } = ctxFromSeed();
    const behaviors = new Set(seed.activity.map((entry) => entry.openBehavior));
    const required: ActivityOpenBehavior[] = [
      "action_sheet",
      "document_viewer",
      "employee_details",
      "result_list",
      "none",
    ];
    for (const behavior of required) {
      expect(behaviors.has(behavior)).toBe(true);
    }
    expect(seed.jobs.some((job) => job.id === "job-karim-seed")).toBe(true);
  });
});
