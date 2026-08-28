"use client";

import { useEffect } from "react";
import { BellRing, Copy, Link2, Share2, Upload } from "lucide-react";
import { toast } from "sonner";
import { copy, documentTypeLabels } from "@/lib/copy";
import { formatDotDate, formatHeDate } from "@/lib/dates";
import { publicRequestUrl } from "@/lib/links";
import { useAppStore } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";

type RenewRequestSheetProps = {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  documentId?: string;
  /** Feed alert to resolve once the request message is sent. */
  activityId?: string;
};

export function RenewRequestSheet({
  open,
  onClose,
  employeeId,
  documentId,
  activityId,
}: RenewRequestSheetProps) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="בקשת חידוש מסמך"
      dialogClassName="max-w-xl"
    >
      <RenewBody
        employeeId={employeeId}
        documentId={documentId}
        activityId={activityId}
        onClose={onClose}
      />
    </ResponsiveSheet>
  );
}

function RenewBody({
  employeeId,
  documentId,
  activityId,
  onClose,
}: Omit<RenewRequestSheetProps, "open">) {
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const requests = useAppStore((state) => state.requests);
  const createDocumentRequest = useAppStore(
    (state) => state.createDocumentRequest,
  );
  const updateRequestMessage = useAppStore(
    (state) => state.updateRequestMessage,
  );
  const markRequestSent = useAppStore((state) => state.markRequestSent);
  const openComposer = useAppStore((state) => state.openComposer);

  const employee = employees.find((entry) => entry.id === employeeId);
  const document = documents.find((entry) => entry.id === documentId);

  // Reuse an open request for the same document, otherwise create one.
  const request =
    requests.find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.replacesDocumentId === documentId &&
        (entry.status === "created" || entry.status === "opened"),
    ) ?? null;

  const missing = Boolean(employee) && !request;
  useEffect(() => {
    if (missing) {
      createDocumentRequest({ employeeId, replacesDocumentId: documentId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missing]);

  if (!employee) return null;

  async function copyMessage() {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request.messageHe);
      toast.success(copy.copiedToast);
      markRequestSent(request.id, activityId);
      onClose();
    } catch {
      toast.error("לא הצלחנו להעתיק. אפשר לסמן ולהעתיק ידנית.");
    }
  }

  async function nativeShare() {
    if (!request) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: request.messageHe });
        markRequestSent(request.id, activityId);
        onClose();
      } catch {
        // User dismissed the native share sheet.
      }
    } else {
      await copyMessage();
    }
  }

  return (
    <div className="grid gap-4 py-1">
      <div className="flex items-center gap-3">
        <Avatar name={employee.fullName} src={employee.profileImage} size="md" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">
            {employee.fullName}
          </p>
          {document ? (
            <p className="text-[13px] text-stone-500">
              {documentTypeLabels[document.typeId]}
              {document.expiresOn
                ? ` · בתוקף עד ${formatDotDate(document.expiresOn)}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>

      {request ? (
        <>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">{copy.renewMessageLabel}</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[14.5px] leading-6 outline-none focus:border-[var(--color-brand)]"
              value={request.messageHe}
              onChange={(event) =>
                updateRequestMessage(request.id, event.target.value)
              }
              rows={4}
            />
          </label>

          <div className="grid gap-1">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Link2 className="size-4 text-stone-400" aria-hidden />
              {copy.renewLinkLabel}
            </span>
            <p
              dir="ltr"
              className="truncate rounded-2xl bg-stone-50 px-4 py-2.5 font-mono text-[12px] text-stone-600"
            >
              {publicRequestUrl(request.token)}
            </p>
            <p className="text-[12.5px] text-stone-500">
              {copy.requestExpiresOn(formatHeDate(request.expiresAt))}
            </p>
          </div>

          <div className="grid gap-2">
            <Button onClick={copyMessage}>
              <Copy className="size-4" aria-hidden />
              {copy.copyMessageAction}
            </Button>
            <Button variant="secondary" onClick={nativeShare}>
              <Share2 className="size-4" aria-hidden />
              {copy.nativeShareAction}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  openComposer({
                    target: {
                      employeeId: employee.id,
                      typeId: document?.typeId,
                      replacesDocumentId: document?.id,
                    },
                    resolvesActivityId: activityId,
                  });
                  onClose();
                }}
              >
                <Upload className="size-4" aria-hidden />
                {copy.uploadMyselfAction}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-stone-500"
                onClick={() => {
                  toast(copy.remindLaterToast);
                  onClose();
                }}
              >
                <BellRing className="size-4" aria-hidden />
                {copy.remindLaterAction}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
