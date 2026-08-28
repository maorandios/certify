"use client";

import { ChevronLeft, FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, documentTypeLabels } from "@/lib/copy";
import { formatDotDate } from "@/lib/dates";
import { documentNeedsReview, isDocumentExpired, isDocumentExpiring } from "@/lib/status";
import type { DocumentRecord } from "@/lib/types";

function rowStatus(
  document: DocumentRecord,
  now: Date,
): { label: string; tone: string } {
  if (document.lifecycle === "superseded") {
    return { label: copy.supersededLabel, tone: "text-stone-400" };
  }
  if (document.lifecycle === "archived") {
    return { label: "בארכיון", tone: "text-stone-400" };
  }
  if (documentNeedsReview(document)) {
    return { label: "נדרשת בדיקה", tone: "text-[var(--status-review,#7C3AED)]" };
  }
  if (isDocumentExpired(document, now)) {
    return { label: "פג תוקף", tone: "text-[var(--status-bad,#DC2626)]" };
  }
  if (isDocumentExpiring(document, now)) {
    return { label: "לקראת פקיעה", tone: "text-[var(--status-warn,#B45309)]" };
  }
  return { label: "בתוקף", tone: "text-[var(--status-ok,#15803D)]" };
}

type DocumentRowProps = {
  document: DocumentRecord;
  now: Date;
  onOpen: (document: DocumentRecord) => void;
};

export function DocumentRow({ document, now, onOpen }: DocumentRowProps) {
  const Icon = document.fileMeta.previewKind === "pdf" ? FileText : ImageIcon;
  const status = rowStatus(document, now);
  const muted =
    document.lifecycle === "superseded" || document.lifecycle === "archived";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(document)}
        className={cn(
          "flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-start shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition-colors active:bg-stone-50",
          muted && "opacity-75",
        )}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500",
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-[var(--ink,#2B2B2B)]">
              {documentTypeLabels[document.typeId]}
            </span>
            <span className={cn("shrink-0 text-[12px] font-medium", status.tone)}>
              {status.label}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-stone-500">
            {document.issuedOn ? `הונפק ${formatDotDate(document.issuedOn)} · ` : ""}
            {document.expiresOn
              ? `בתוקף עד ${formatDotDate(document.expiresOn)}`
              : copy.noExpiryDate}
          </span>
        </span>
        <ChevronLeft className="size-4 shrink-0 text-stone-400" aria-hidden />
      </button>
    </li>
  );
}
