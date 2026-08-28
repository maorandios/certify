"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarClock,
  Download,
  FileText,
  ImageIcon,
  LinkIcon,
  PackageOpen,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy, documentTypeLabels } from "@/lib/copy";
import { formatDotDate, formatHeDate } from "@/lib/dates";
import { isDocumentExpired, isDocumentExpiring } from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRecord } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { PublicBrand } from "@/components/public/PublicBrand";
import { PublicHydrator } from "@/components/public/PublicHydrator";

function docStatusLabel(document: DocumentRecord, now: Date): string {
  if (isDocumentExpired(document, now)) return "פג תוקף";
  if (isDocumentExpiring(document, now)) return "לקראת פקיעה";
  return "בתוקף";
}

function SharePreview() {
  const params = useParams<{ token: string }>();
  const shares = useAppStore((state) => state.shares);
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const share = shares.find((entry) => entry.token === params.token);
  const now = useMemo(() => new Date(), []);

  if (!share) {
    return (
      <CenteredNote
        icon={<LinkIcon className="size-8 text-stone-300" aria-hidden />}
        title={copy.publicShareInvalid}
        body={copy.publicShareInvalidBody}
      />
    );
  }

  const expired =
    share.status !== "active" ||
    new Date(share.expiresAt + "T23:59:59").getTime() < now.getTime();

  if (expired) {
    return (
      <CenteredNote
        icon={<CalendarClock className="size-8 text-stone-300" aria-hidden />}
        title={copy.publicShareExpired}
        body={copy.publicShareInvalidBody}
      />
    );
  }

  // Only the documents explicitly included in the package are exposed.
  const groups = share.employeeIds
    .map((employeeId) => {
      const employee = employees.find((entry) => entry.id === employeeId);
      const docs = documents.filter(
        (document) =>
          document.employeeId === employeeId &&
          share.documentIds.includes(document.id),
      );
      return employee && docs.length > 0 ? { employee, docs } : null;
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  if (groups.length === 0) {
    return (
      <CenteredNote
        icon={<PackageOpen className="size-8 text-stone-300" aria-hidden />}
        title={copy.publicShareEmpty}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <PublicBrand subtitle={copy.publicShareBy} />
      <h1 className="mt-5 text-center text-xl font-semibold">
        {copy.publicShareTitle}
      </h1>
      <p className="mt-1 text-center text-[13px] text-stone-500">
        {copy.shareExpiryNote(formatHeDate(share.expiresAt))}
      </p>

      <div className="mt-6 grid gap-5">
        {groups.map((group) => (
          <section
            key={group.employee.id}
            className="rounded-[24px] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
          >
            <header className="flex items-center gap-3">
              <Avatar
                name={group.employee.fullName}
                src={group.employee.profileImage}
                size="md"
              />
              <span className="text-[16px] font-semibold">
                {group.employee.fullName}
              </span>
            </header>
            <ul className="mt-3 grid gap-2">
              {group.docs.map((document) => {
                const expanded = previewId === document.id;
                return (
                  <li
                    key={document.id}
                    className="rounded-2xl border border-stone-100"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewId(expanded ? null : document.id)
                      }
                      className="flex min-h-[56px] w-full items-center gap-3 px-3.5 py-2.5 text-start"
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500"
                        aria-hidden
                      >
                        {document.fileMeta.previewKind === "pdf" ? (
                          <FileText className="size-4" />
                        ) : (
                          <ImageIcon className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14.5px] font-semibold">
                            {documentTypeLabels[document.typeId]}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[12px] font-medium",
                              isDocumentExpired(document, now)
                                ? "text-[var(--status-bad,#DC2626)]"
                                : isDocumentExpiring(document, now)
                                  ? "text-[var(--status-warn,#B45309)]"
                                  : "text-[var(--status-ok,#15803D)]",
                            )}
                          >
                            {docStatusLabel(document, now)}
                          </span>
                        </span>
                        <span className="block text-[12.5px] text-stone-500">
                          {document.issuedOn
                            ? `הונפק ${formatDotDate(document.issuedOn)} · `
                            : ""}
                          {document.expiresOn
                            ? `בתוקף עד ${formatDotDate(document.expiresOn)}`
                            : copy.noExpiryDate}
                        </span>
                      </span>
                    </button>
                    {expanded ? (
                      <div className="border-t border-stone-100 px-3.5 py-3">
                        <div
                          className="mx-auto flex aspect-[4/3] max-w-xs items-center justify-center rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100"
                          aria-hidden
                        >
                          {document.fileMeta.previewKind === "pdf" ? (
                            <FileText className="size-9 text-stone-300" />
                          ) : (
                            <ImageIcon className="size-9 text-stone-300" />
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span
                            className="truncate font-mono text-[11.5px] text-stone-400"
                            dir="ltr"
                          >
                            {document.fileMeta.name} · {document.fileMeta.sizeLabel}
                          </span>
                          <button
                            type="button"
                            className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--color-brand,#FF5900)]"
                            onClick={() => toast(copy.publicDownloadToast)}
                          >
                            <Download className="size-4" aria-hidden />
                            {copy.publicDownload}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function CenteredNote({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <PublicBrand />
      {icon}
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {body ? <p className="mt-1 text-[13.5px] text-stone-500">{body}</p> : null}
      </div>
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <div className="min-h-svh bg-[#FEF6F2]">
      <PublicHydrator>
        <SharePreview />
      </PublicHydrator>
      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
