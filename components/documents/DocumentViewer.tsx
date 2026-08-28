"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  FileText,
  History,
  ImageIcon,
  Share2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  copy,
  documentTypeLabels,
  extractedFieldLabels,
  lifecycleLabels,
} from "@/lib/copy";
import { daysUntil, formatDotDate } from "@/lib/dates";
import { documentNeedsReview, isDocumentExpired, isDocumentExpiring, isHistoryDocument } from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import {
  ActivitySheetHeader,
  activityForDocument,
} from "@/components/home/ActivitySheetHeader";
import { RenewRequestSheet } from "@/components/requests/RenewRequestSheet";

function expiryInterpretation(document: DocumentRecord, now: Date): string {
  if (!document.expiresOn) return "למסמך אין תאריך תוקף מוגדר";
  const days = daysUntil(document.expiresOn, now);
  if (days < 0) return `פג תוקף לפני ${Math.abs(days)} ימים`;
  if (days === 0) return "פג תוקף היום";
  if (days <= (document.warningDays ?? 30)) return `יפוג בעוד ${days} ימים`;
  return `בתוקף לעוד ${days} ימים`;
}

type DocumentViewerProps = {
  document: DocumentRecord | null;
  onClose: () => void;
  onShare?: (employeeId: string) => void;
};

export function DocumentViewer({
  document: documentProp,
  onClose,
  onShare,
}: DocumentViewerProps) {
  if (!documentProp) return null;
  // Keyed by document id so internal state resets when a new doc opens.
  return (
    <ViewerBody
      key={documentProp.id}
      document={documentProp}
      onClose={onClose}
      onShare={onShare}
    />
  );
}

function ViewerBody({
  document: documentProp,
  onClose,
  onShare,
}: DocumentViewerProps & { document: DocumentRecord }) {
  const isDesktop = useIsDesktop();
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const activity = useAppStore((state) => state.activity);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const openComposer = useAppStore((state) => state.openComposer);
  const confirmDocumentField = useAppStore(
    (state) => state.confirmDocumentField,
  );

  // Allow drilling into the previous (superseded) version without closing.
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [fixValue, setFixValue] = useState("");
  const [renewOpen, setRenewOpen] = useState(false);

  const doc = overrideId
    ? (documents.find((entry) => entry.id === overrideId) ?? documentProp)
    : documentProp;

  const now = useMemo(() => new Date(seedAnchor), [seedAnchor]);
  const employee = employees.find((entry) => entry.id === doc?.employeeId);
  const previous = useMemo(() => {
    if (!doc || doc.lifecycle !== "active") return undefined;
    return documents
      .filter(
        (entry) =>
          entry.employeeId === doc.employeeId &&
          entry.typeId === doc.typeId &&
          entry.lifecycle === "superseded",
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [doc, documents]);

  const pendingFieldActivity = useMemo(() => {
    if (!doc) return undefined;
    return activity.find(
      (item) =>
        !item.resolved &&
        item.documentId === doc.id &&
        item.actionKind === "confirm_field",
    );
  }, [doc, activity]);

  if (!doc) return null;

  const readOnly = isHistoryDocument(doc);
  const uncertain = new Set(doc.uncertainFieldKeys ?? []);

  const fields: Array<{
    key: string;
    label: string;
    value: string;
    flagged?: boolean;
  }> = [];
  if (employee) {
    fields.push({
      key: "fullName",
      label: extractedFieldLabels.fullName,
      value: employee.fullName,
      flagged: uncertain.has("fullName"),
    });
    fields.push({
      key: "identityNumber",
      label: extractedFieldLabels.identityNumber,
      value: employee.identityNumber,
      flagged: uncertain.has("identityNumber"),
    });
  }
  fields.push({
    key: "title",
    label: extractedFieldLabels.title,
    value: doc.title,
  });
  fields.push({
    key: "typeId",
    label: extractedFieldLabels.typeId,
    value: documentTypeLabels[doc.typeId],
    flagged: uncertain.has("typeId"),
  });
  if (doc.credentialNumber) {
    fields.push({
      key: "credentialNumber",
      label: extractedFieldLabels.credentialNumber,
      value: doc.credentialNumber,
      flagged: uncertain.has("credentialNumber"),
    });
  }
  if (doc.issuer) {
    fields.push({
      key: "issuer",
      label: extractedFieldLabels.issuer,
      value: doc.issuer,
    });
  }
  if (doc.issuedOn) {
    fields.push({
      key: "issuedOn",
      label: extractedFieldLabels.issuedOn,
      value: formatDotDate(doc.issuedOn),
    });
  }
  if (doc.validFrom) {
    fields.push({
      key: "validFrom",
      label: extractedFieldLabels.validFrom,
      value: formatDotDate(doc.validFrom),
    });
  }
  fields.push({
    key: "expiresOn",
    label: extractedFieldLabels.expiresOn,
    value: doc.expiresOn ? formatDotDate(doc.expiresOn) : copy.noExpiryDate,
    flagged: uncertain.has("expiresOn"),
  });

  const hasUncertain = fields.some((field) => field.flagged);

  const body = (
    <div className="grid gap-5 pb-2">
      {readOnly ? (
        <p className="flex items-center gap-2 rounded-2xl bg-stone-100 px-3 py-2.5 text-[13px] text-stone-600">
          <History className="size-4 shrink-0" aria-hidden />
          {copy.viewerReadOnly}
        </p>
      ) : null}

      {/* Layer 1: original document */}
      <section aria-label={copy.viewerOriginalSection}>
        <h3 className="text-sm font-semibold text-stone-500">
          {copy.viewerOriginalSection}
        </h3>
        <div className="mt-2 grid gap-3 rounded-[20px] bg-stone-50 p-3 sm:grid-cols-[128px_1fr]">
          <div
            className="relative mx-auto flex aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            aria-hidden
          >
            {doc.fileMeta.previewKind === "pdf" ? (
              <div className="flex w-full flex-col gap-1.5 px-3">
                <div className="mx-auto mb-1 h-2 w-1/2 rounded bg-stone-300" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-1.5 rounded bg-stone-200"
                    style={{ width: `${90 - index * 8}%` }}
                  />
                ))}
                <FileText className="mt-2 size-6 self-end text-stone-300" />
              </div>
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                <ImageIcon className="size-8 text-stone-400" />
              </div>
            )}
          </div>
          <dl className="grid content-start gap-1.5 text-[13.5px]">
            <MetaRow label={copy.viewerFileName} value={doc.fileMeta.name} ltr />
            <MetaRow
              label={copy.viewerFileType}
              value={doc.fileMeta.previewKind === "pdf" ? "PDF" : "תמונה"}
            />
            <MetaRow label={copy.viewerFileSize} value={doc.fileMeta.sizeLabel} ltr />
            {doc.fileMeta.pages ? (
              <MetaRow label={copy.viewerPages} value={String(doc.fileMeta.pages)} />
            ) : null}
            <MetaRow
              label={copy.viewerUploadedOn}
              value={formatDotDate(doc.createdAt.slice(0, 10))}
            />
          </dl>
        </div>
      </section>

      {/* Layer 2: extracted information */}
      <section aria-label={copy.viewerExtractedSection}>
        <h3 className="text-sm font-semibold text-stone-500">
          {copy.viewerExtractedSection}
        </h3>
        {hasUncertain ? (
          <p className="mt-2 flex items-start gap-2 rounded-2xl bg-[var(--status-warn-soft,#FEF3C7)] px-3 py-2.5 text-[13px] leading-5 text-[var(--status-warn,#B45309)]">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {copy.viewerUncertainHint}
          </p>
        ) : null}
        <dl className="mt-2 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          {fields.map((field) => (
            <div
              key={field.key}
              className={cn(
                "flex items-baseline justify-between gap-3 border-b border-stone-100 px-4 py-2.5 last:border-b-0",
                field.flagged && "bg-[var(--status-warn-soft,#FEF3C7)]/60",
              )}
            >
              <dt className="shrink-0 text-[13px] text-stone-500">
                {field.label}
              </dt>
              <dd className="min-w-0 truncate text-[14px] font-medium">
                {field.flagged ? (
                  <span className="inline-flex items-center gap-1.5">
                    <TriangleAlert
                      className="size-3.5 text-[var(--status-warn,#B45309)]"
                      aria-hidden
                    />
                    {field.value}
                  </span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-3 border-t border-stone-100 px-4 py-2.5">
            <dt className="shrink-0 text-[13px] text-stone-500">
              {copy.viewerExpiryInterpretation}
            </dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-[14px] font-medium">
              <CalendarClock className="size-3.5 text-stone-400" aria-hidden />
              {expiryInterpretation(doc, now)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-stone-100 px-4 py-2.5">
            <dt className="shrink-0 text-[13px] text-stone-500">
              {copy.viewerStatusLabel}
            </dt>
            <dd className="text-[14px] font-medium">
              {lifecycleLabels[doc.lifecycle]}
            </dd>
          </div>
        </dl>

        {doc.permissionsHe && doc.permissionsHe.length > 0 ? (
          <div className="mt-2.5">
            <p className="text-[13px] text-stone-500">
              {extractedFieldLabels.permissionsHe}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {doc.permissionsHe.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-[12.5px] font-medium text-stone-600"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {doc.restrictionsHe && doc.restrictionsHe.length > 0 ? (
          <div className="mt-2.5">
            <p className="text-[13px] text-stone-500">
              {extractedFieldLabels.restrictionsHe}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {doc.restrictionsHe.map((restriction) => (
                <span
                  key={restriction}
                  className="rounded-full bg-[var(--status-warn-soft,#FEF3C7)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--status-warn,#B45309)]"
                >
                  {restriction}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Complete-details inline flow for documents pending review */}
      {!readOnly && documentNeedsReview(doc) ? (
        <section className="rounded-[20px] bg-[var(--color-brand-soft,#FFEDE0)] p-4">
          <h3 className="text-sm font-semibold">{copy.viewerCompleteDetails}</h3>
          <p className="mt-1 text-[13px] leading-5 text-stone-600">
            {pendingFieldActivity?.evidenceHe ?? copy.viewerUncertainHint}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              className="min-h-11 flex-1 rounded-2xl border border-[var(--line)] bg-white px-3 text-[15px] outline-none focus:border-[var(--color-brand)]"
              value={fixValue}
              onChange={(event) => setFixValue(event.target.value)}
            />
            <Button
              disabled={!fixValue}
              onClick={() => {
                confirmDocumentField(doc.id, fixValue);
                onClose();
              }}
            >
              {copy.confirmFieldFix}
            </Button>
          </div>
        </section>
      ) : null}

      {/* Minimal actions */}
      <div className="flex flex-wrap gap-2">
        {!readOnly &&
        employee &&
        (isDocumentExpired(doc, now) || isDocumentExpiring(doc, now)) ? (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setRenewOpen(true)}
          >
            <CalendarClock className="size-4" aria-hidden />
            {copy.viewerPrepareRenew}
          </Button>
        ) : null}
        {!readOnly && doc.lifecycle === "active" && employee && onShare ? (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              onClose();
              onShare(employee.id);
            }}
          >
            <Share2 className="size-4" aria-hidden />
            {copy.shareAction}
          </Button>
        ) : null}
        {!readOnly && employee ? (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              openComposer({
                target: {
                  employeeId: employee.id,
                  typeId: doc.typeId,
                  replacesDocumentId:
                    doc.lifecycle === "active" ? doc.id : undefined,
                },
              });
              onClose();
            }}
          >
            <Upload className="size-4" aria-hidden />
            {copy.uploadNew}
          </Button>
        ) : null}
        {previous ? (
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setOverrideId(previous.id)}
          >
            <History className="size-4" aria-hidden />
            {copy.viewerShowPrevious}
          </Button>
        ) : null}
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          <X className="size-4" aria-hidden />
          {copy.viewerClose}
        </Button>
      </div>
    </div>
  );

  const title = `${documentTypeLabels[doc.typeId]}${employee ? ` · ${employee.fullName}` : ""}`;
  const feedActivity = activityForDocument(activity, doc.id);
  const header = feedActivity ? (
    <ActivitySheetHeader item={feedActivity} employee={employee} />
  ) : undefined;

  const shell = isDesktop ? (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      header={header}
      className="max-h-[86vh] max-w-2xl overflow-y-auto bg-[#FFFDFB]"
    >
      {body}
    </Dialog>
  ) : (
    <Drawer
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      header={header}
      className="top-[max(0.75rem,env(safe-area-inset-top))] h-auto bg-[#FFFDFB]"
      contentClassName="h-[calc(100%-4.5rem)] max-h-none"
    >
      {body}
    </Drawer>
  );

  return (
    <>
      {shell}
      {employee ? (
        <RenewRequestSheet
          open={renewOpen}
          onClose={() => setRenewOpen(false)}
          employeeId={employee.id}
          documentId={doc.id}
        />
      ) : null}
    </>
  );
}

function MetaRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-stone-500">{label}</dt>
      <dd
        className={cn("min-w-0 truncate font-medium", ltr && "font-mono text-[12.5px]")}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
