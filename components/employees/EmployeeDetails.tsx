"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FilePlus2, Pencil, Share2 } from "lucide-react";
import { copy } from "@/lib/copy";
import { formatDotDate } from "@/lib/dates";
import {
  documentNeedsReview,
  employeeStatusDetailHe,
  getEmployeeDocumentStatus,
  isDocumentExpired,
  isDocumentExpiring,
  isHistoryDocument,
  isStatusDocument,
} from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRecord } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentRow } from "@/components/documents/DocumentRow";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { ShareSheet } from "@/components/share/ShareSheet";
import { RenewRequestSheet } from "@/components/requests/RenewRequestSheet";
import { EmployeeFormSheet } from "./EmployeeFormSheet";

type EmployeeDetailsProps = {
  employeeId: string;
  /** Renders a back link to the employees list (mobile page). */
  showBack?: boolean;
};

export function EmployeeDetails({ employeeId, showBack }: EmployeeDetailsProps) {
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const openComposer = useAppStore((state) => state.openComposer);

  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renewDocId, setRenewDocId] = useState<string | null>(null);

  const employee = employees.find((entry) => entry.id === employeeId);
  const now = useMemo(() => new Date(seedAnchor), [seedAnchor]);

  const owned = useMemo(
    () =>
      documents
        .filter((document) => document.employeeId === employeeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [documents, employeeId],
  );

  if (!employee) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-lg font-semibold">{copy.employeeNotFound}</p>
        <Link href="/employees" className="text-[var(--color-brand)] underline">
          {copy.employeesTitle}
        </Link>
      </div>
    );
  }

  const status = getEmployeeDocumentStatus(employee, documents, now);
  const detail = employeeStatusDetailHe(employee, documents, now);

  const attention = owned.filter(
    (document) =>
      isStatusDocument(document) &&
      (documentNeedsReview(document) ||
        isDocumentExpired(document, now) ||
        isDocumentExpiring(document, now)),
  );
  const activeHealthy = owned.filter(
    (document) =>
      document.lifecycle === "active" && !attention.includes(document),
  );
  const history = owned.filter(isHistoryDocument);
  const shareable = owned.some(
    (document) =>
      document.lifecycle === "active" && document.processingStatus === "ready",
  );

  return (
    <div className="flex w-full flex-col gap-5">
      {showBack ? (
        <Link
          href="/employees"
          className="-mb-1 flex min-h-11 items-center gap-1 text-[14px] font-medium text-stone-500"
        >
          <ChevronRight className="size-4" aria-hidden />
          {copy.employeesTitle}
        </Link>
      ) : null}

      {/* Identity header */}
      <header className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        <Avatar name={employee.fullName} src={employee.profileImage} size="xl" />
        <div>
          <h2 className="text-xl font-semibold">{employee.fullName}</h2>
          <p className="mt-0.5 text-[13.5px] text-stone-500" dir="ltr">
            {employee.identityNumber}
          </p>
        </div>
        {employee.description ? (
          <p className="max-w-sm text-[13.5px] leading-5 text-stone-600">
            {employee.description}
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-1.5">
          <StatusBadge status={status} />
          <p className="text-[12.5px] text-stone-500">{detail}</p>
        </div>

        <div className="mt-1 flex w-full max-w-sm items-center gap-2">
          <Button
            className="flex-1"
            onClick={() =>
              openComposer({ target: { employeeId: employee.id } })
            }
          >
            <FilePlus2 className="size-4" aria-hidden />
            {copy.uploadForEmployee}
          </Button>
          {shareable ? (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" aria-hidden />
              {copy.shareAction}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="size-11 min-h-11 shrink-0 px-0"
            aria-label={copy.editProfile}
            title={copy.editProfile}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="text-[11.5px] text-stone-400">
          {copy.employeeSince(formatDotDate(employee.createdAt.slice(0, 10)))}
        </p>
      </header>

      {owned.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[28px] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <p className="text-[15px] font-semibold">{copy.noDocumentsYetTitle}</p>
          <p className="max-w-xs text-[13.5px] text-stone-500">
            {copy.noDocumentsYetBody}
          </p>
        </div>
      ) : null}

      {attention.length > 0 ? (
        <section aria-label={copy.sectionAttention}>
          <h3 className="px-1 text-sm font-semibold text-stone-500">
            {copy.sectionAttention}
          </h3>
          <ul className="mt-2 grid gap-2">
            {attention.map((document) => {
              const expiryIssue =
                !documentNeedsReview(document) &&
                (isDocumentExpired(document, now) ||
                  isDocumentExpiring(document, now));
              return (
                <div key={document.id} className="grid gap-1">
                  <DocumentRow document={document} now={now} onOpen={setViewerDoc} />
                  {expiryIssue ? (
                    <button
                      type="button"
                      className="me-1 min-h-11 self-end px-2 text-[13px] font-medium text-[var(--color-brand)]"
                      onClick={() => setRenewDocId(document.id)}
                    >
                      שליחת בקשת חידוש לעובד
                    </button>
                  ) : null}
                </div>
              );
            })}
          </ul>
        </section>
      ) : null}

      {activeHealthy.length > 0 ? (
        <section aria-label={copy.sectionActive}>
          <h3 className="px-1 text-sm font-semibold text-stone-500">
            {copy.sectionActive}
          </h3>
          <ul className="mt-2 grid gap-2">
            {activeHealthy.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                now={now}
                onOpen={setViewerDoc}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section aria-label={copy.sectionHistory}>
          <h3 className="px-1 text-sm font-semibold text-stone-500">
            {copy.sectionHistory}
          </h3>
          <ul className="mt-2 grid gap-2">
            {history.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                now={now}
                onOpen={setViewerDoc}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <DocumentViewer
        document={viewerDoc}
        onClose={() => setViewerDoc(null)}
        onShare={() => setShareOpen(true)}
      />
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        employeeIds={[employee.id]}
      />
      <EmployeeFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        employee={employee}
      />
      {renewDocId ? (
        <RenewRequestSheet
          open
          onClose={() => setRenewDocId(null)}
          employeeId={employee.id}
          documentId={renewDocId}
        />
      ) : null}
    </div>
  );
}
