import { describe, expect, it } from "vitest";
import { sortActivityItems, unresolvedActivityCount } from "./activity";
import { getDocumentAttention } from "./status";
import { createSeed } from "./mock/seed";
import type { ActivityItem, DocumentRecord } from "./types";

const now = new Date("2026-08-27T12:00:00.000Z");

describe("activity ordering", () => {
  it("orders action, expired alerts, expiring alerts, then updates", () => {
    const documents: DocumentRecord[] = [
      {
        id: "expired-doc",
        employeeId: "e1",
        typeId: "professional",
        title: "רישיון מקצועי",
        expiresOn: "2026-08-26",
        lifecycle: "active",
        processingStatus: "ready",
        fileMeta: {
          name: "a.pdf",
          mime: "application/pdf",
          sizeLabel: "1 KB",
          previewKind: "pdf",
        },
        warningDays: 30,
        createdAt: now.toISOString(),
      },
      {
        id: "expiring-doc",
        employeeId: "e2",
        typeId: "height_work",
        title: "אישור עבודה בגובה",
        expiresOn: "2026-09-10",
        lifecycle: "active",
        processingStatus: "ready",
        fileMeta: {
          name: "b.jpg",
          mime: "image/jpeg",
          sizeLabel: "1 KB",
          previewKind: "image",
        },
        warningDays: 30,
        createdAt: now.toISOString(),
      },
    ];

    const items: ActivityItem[] = [
      {
        id: "u",
        type: "update",
        titleHe: "עדכון",
        timestamp: "2026-08-27T11:00:00.000Z",
      },
      {
        id: "expiring",
        type: "alert",
        titleHe: "יפוג",
        documentId: "expiring-doc",
        timestamp: "2026-08-27T10:00:00.000Z",
      },
      {
        id: "expired",
        type: "alert",
        titleHe: "פג",
        documentId: "expired-doc",
        timestamp: "2026-08-27T09:00:00.000Z",
      },
      {
        id: "action",
        type: "action",
        titleHe: "חסר תאריך",
        timestamp: "2026-08-27T08:00:00.000Z",
      },
    ];

    expect(sortActivityItems(items, documents, now).map((item) => item.id)).toEqual([
      "action",
      "expired",
      "expiring",
      "u",
    ]);
  });

  it("counts unresolved action and alert items", () => {
    expect(
      unresolvedActivityCount([
        { id: "1", type: "action", titleHe: "a", timestamp: now.toISOString() },
        { id: "2", type: "alert", titleHe: "b", timestamp: now.toISOString() },
        { id: "3", type: "update", titleHe: "c", timestamp: now.toISOString() },
      ]),
    ).toBe(2);
  });
});

describe("document attention pulse", () => {
  it("counts active stored documents that need attention", () => {
    const seed = createSeed(now);
    expect(getDocumentAttention(seed.documents, now)).toEqual({
      expired: 2,
      expiring: 2,
      needsReview: 1,
    });
  });
});
