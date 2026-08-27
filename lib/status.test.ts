import { describe, expect, it } from "vitest";
import type { DocumentRecord, Employee } from "./types";
import { getEmployeeDocumentStatus } from "./status";

const employee: Employee = {
  id: "e1",
  fullName: "בדיקה",
  identityNumber: "123456789",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function doc(partial: Partial<DocumentRecord>): DocumentRecord {
  return {
    id: "d1",
    employeeId: "e1",
    typeId: "height_work",
    title: "אישור עבודה בגובה",
    lifecycle: "active",
    processingStatus: "ready",
    fileMeta: {
      name: "doc.jpg",
      mime: "image/jpeg",
      sizeLabel: "1 MB",
      previewKind: "image",
    },
    warningDays: 30,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const now = new Date("2026-08-27T12:00:00.000Z");

describe("getEmployeeDocumentStatus", () => {
  it("returns no_documents when there are no active documents", () => {
    expect(getEmployeeDocumentStatus(employee, [], now)).toBe("no_documents");
    expect(
      getEmployeeDocumentStatus(
        employee,
        [doc({ lifecycle: "superseded", expiresOn: "2020-01-01" })],
        now,
      ),
    ).toBe("no_documents");
  });

  it("ignores superseded expired documents after a valid replacement", () => {
    expect(
      getEmployeeDocumentStatus(
        employee,
        [
          doc({
            id: "old",
            lifecycle: "superseded",
            expiresOn: "2026-01-01",
          }),
          doc({
            id: "new",
            expiresOn: "2027-08-27",
          }),
        ],
        now,
      ),
    ).toBe("current");
  });

  it("returns needs_review before expired when extraction is uncertain", () => {
    expect(
      getEmployeeDocumentStatus(
        employee,
        [
          doc({
            processingStatus: "uncertain",
            uncertainFieldKeys: ["expiresOn"],
            expiresOn: "2026-01-01",
          }),
        ],
        now,
      ),
    ).toBe("needs_review");
  });

  it("returns expired, expiring, then current in that order", () => {
    expect(
      getEmployeeDocumentStatus(
        employee,
        [doc({ expiresOn: "2026-08-26" })],
        now,
      ),
    ).toBe("expired");
    expect(
      getEmployeeDocumentStatus(
        employee,
        [doc({ expiresOn: "2026-09-10" })],
        now,
      ),
    ).toBe("expiring");
    expect(
      getEmployeeDocumentStatus(
        employee,
        [doc({ expiresOn: "2027-08-27" })],
        now,
      ),
    ).toBe("current");
  });

  it("treats documents without expiration as valid", () => {
    expect(getEmployeeDocumentStatus(employee, [doc({})], now)).toBe("current");
  });
});
