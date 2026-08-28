"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy, documentTypeLabels } from "@/lib/copy";
import { formatDotDate, formatHeDate } from "@/lib/dates";
import { publicShareUrl } from "@/lib/links";
import { isDocumentExpired, isDocumentExpiring } from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRecord, Employee, ShareLink } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { sheetDrawerClassName } from "@/components/home/ActivitySheetHeader";

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  employeeIds: string[];
};

/**
 * Eligibility: only active, readable documents can be shared. Superseded,
 * archived, failed and unreadable/uncertain documents never appear.
 */
function isEligible(document: DocumentRecord): boolean {
  return (
    document.lifecycle === "active" && document.processingStatus === "ready"
  );
}

export function ShareSheet({ open, onClose, employeeIds }: ShareSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={copy.shareTitle}
      drawerClassName={sheetDrawerClassName}
      dialogClassName="max-h-[80vh] max-w-xl overflow-y-auto bg-[#FFFDFB]"
    >
      {/* Mounts fresh on open, resetting the selection and phase. */}
      <ShareBody employeeIds={employeeIds} />
    </ResponsiveSheet>
  );
}

type Group = { employee: Employee; docs: DocumentRecord[] };

function ShareBody({ employeeIds }: { employeeIds: string[] }) {
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const createShare = useAppStore((state) => state.createShare);

  const now = useMemo(() => new Date(seedAnchor), [seedAnchor]);
  const groups = useMemo<Group[]>(
    () =>
      employeeIds
        .map((id) => {
          const employee = employees.find((entry) => entry.id === id);
          const docs = documents.filter(
            (document) => document.employeeId === id && isEligible(document),
          );
          return employee ? { employee, docs } : null;
        })
        .filter((group): group is Group => group !== null),
    [employeeIds, employees, documents],
  );

  // Defaults: current + expiring on, expired off.
  const [selected, setSelected] = useState<Set<string>>(() => {
    const defaults = new Set<string>();
    for (const group of groups) {
      for (const document of group.docs) {
        if (!isDocumentExpired(document, now)) defaults.add(document.id);
      }
    }
    return defaults;
  });
  const [phase, setPhase] = useState<"pick" | "generating" | "ready">("pick");
  const [share, setShare] = useState<ShareLink | null>(null);

  const totalEligible = groups.reduce((sum, group) => sum + group.docs.length, 0);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function generate() {
    setPhase("generating");
    // Simulated link generation delay.
    window.setTimeout(() => {
      const link = createShare({
        employeeIds: groups
          .filter((group) => group.docs.some((doc) => selected.has(doc.id)))
          .map((group) => group.employee.id),
        documentIds: [...selected],
      });
      setShare(link);
      setPhase("ready");
    }, 1200);
  }

  async function copyLink() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(publicShareUrl(share.token));
      toast.success(copy.linkCopiedToast);
    } catch {
      toast.error("לא הצלחנו להעתיק. אפשר להעתיק ידנית מהשדה.");
    }
  }

  async function nativeShare() {
    if (!share) return;
    const url = publicShareUrl(share.token);
    if (navigator.share) {
      try {
        await navigator.share({ title: copy.publicShareTitle, url });
      } catch {
        // User dismissed the share sheet.
      }
    } else {
      await copyLink();
    }
  }

  if (totalEligible === 0) {
    return <p className="py-4 text-sm text-stone-500">{copy.shareNoDocuments}</p>;
  }

  if (phase === "generating") {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 py-6">
        <Loader2 className="size-7 animate-spin text-[var(--color-brand)]" />
        <p className="text-sm font-medium text-stone-600">
          {copy.shareGenerating}
        </p>
      </div>
    );
  }

  if (phase === "ready" && share) {
    return (
      <div className="grid gap-4 py-1">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-[var(--status-ok,#15803D)]">
          <Check className="size-5" aria-hidden />
          {copy.shareReady}
        </div>
        <div
          dir="ltr"
          className="truncate rounded-2xl bg-stone-50 px-4 py-3 font-mono text-[12.5px] text-stone-600"
        >
          {publicShareUrl(share.token)}
        </div>
        <p className="text-[13px] text-stone-500">
          {copy.shareExpiryNote(formatHeDate(share.expiresAt))}
        </p>
        <div className="grid gap-2">
          <Button onClick={copyLink}>
            <Copy className="size-4" aria-hidden />
            {copy.shareCopyLink}
          </Button>
          <Button variant="secondary" onClick={nativeShare}>
            <Share2 className="size-4" aria-hidden />
            {copy.nativeShareAction}
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open(publicShareUrl(share.token), "_blank")}
          >
            <ExternalLink className="size-4" aria-hidden />
            {copy.shareOpenPreview}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 py-1">
      {groups.map((group) => (
        <section key={group.employee.id}>
          <header className="flex items-center gap-2.5">
            <Avatar
              name={group.employee.fullName}
              src={group.employee.profileImage}
              size="sm"
            />
            <span className="text-[15px] font-semibold">
              {group.employee.fullName}
            </span>
          </header>
          <ul className="mt-2 grid gap-1.5">
            {group.docs.map((document) => {
              const expired = isDocumentExpired(document, now);
              const expiring = !expired && isDocumentExpiring(document, now);
              const checked = selected.has(document.id);
              return (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => toggle(document.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-start transition-colors",
                      checked
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft,#FFEDE0)]/50"
                        : "border-[var(--line)] bg-white",
                    )}
                    aria-pressed={checked}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        checked
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : "border-stone-300 bg-white",
                      )}
                      aria-hidden
                    >
                      {checked ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">
                        {documentTypeLabels[document.typeId]}
                      </span>
                      <span className="block text-[12px] text-stone-500">
                        {document.expiresOn
                          ? `בתוקף עד ${formatDotDate(document.expiresOn)}`
                          : copy.noExpiryDate}
                        {expiring ? (
                          <span className="text-[var(--status-warn,#B45309)]">
                            {" "}
                            · {copy.shareExpiringMark}
                          </span>
                        ) : null}
                        {expired ? (
                          <span className="text-[var(--status-bad,#DC2626)]">
                            {" "}
                            · {copy.shareExpiredOff}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="sticky bottom-0 grid gap-1.5 bg-white/95 pt-1 backdrop-blur">
        <Button disabled={selected.size === 0} onClick={generate}>
          <Link2 className="size-4" aria-hidden />
          {copy.shareCreateLink}
        </Button>
        <p className="text-center text-[12.5px] text-stone-500">
          {copy.shareDocsCount(selected.size)}
        </p>
      </div>
    </div>
  );
}
