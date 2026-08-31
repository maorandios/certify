"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import {
  capabilitiesForProblem,
  primaryProblemFor,
  visibleCapabilities,
  type AgenticActionKind,
} from "@/lib/agenticActions";
import { publicRequestUrl, mailtoShareUrl, whatsappShareUrl } from "@/lib/links";
import { useAppStore, reuploadMessage } from "@/lib/store";
import type { ActivityItem, SourceFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import {
  ActivitySheetHeader,
  sheetContentClassName,
  sheetDialogClassName,
  sheetDrawerClassName,
  sheetOverlayClassName,
} from "./ActivitySheetHeader";

type ViewerTarget = {
  document?: { title?: string } | null;
  sourceFile?: SourceFile | null;
};

type AgenticActionSheetProps = {
  item: ActivityItem | null;
  onClose: () => void;
  onViewDocument: (target: ViewerTarget) => void;
};

export function AgenticActionSheet({
  item,
  onClose,
  onViewDocument,
}: AgenticActionSheetProps) {
  const isDesktop = useIsDesktop();
  const requests = useAppStore((state) => state.requests);
  const workers = useAppStore((state) => state.workerSubmissions);
  const documents = useAppStore((state) => state.documentSubmissions);
  const cases = useAppStore((state) => state.cases);
  const sourceFiles = useAppStore((state) => state.sourceFiles);
  const answerCase = useAppStore((state) => state.answerCase);
  const approveWorker = useAppStore((state) => state.approveWorker);
  const createReuploadLink = useAppStore((state) => state.createReuploadLink);
  const openComposer = useAppStore((state) => state.openComposer);
  const closeRequest = useAppStore((state) => state.closeRequest);
  const reopenRequest = useAppStore((state) => state.reopenRequest);
  const extendRequestExpiry = useAppStore((state) => state.extendRequestExpiry);
  const [nameValue, setNameValue] = useState("");
  const [dateValue, setDateValue] = useState("");

  const request = requests.find((entry) => entry.id === item?.requestId);
  const worker = workers.find((entry) => entry.id === item?.workerSubmissionId);
  const workerDocs = documents.filter((doc) => doc.workerSubmissionId === worker?.id);
  const workerCases = cases.filter((entry) => entry.workerSubmissionId === worker?.id);
  const focusCase =
    workerCases.find((entry) => entry.issues.some((issue) => issue.state === "open")) ??
    workerCases[0] ??
    cases.find((entry) => entry.id === item?.caseId);

  const caps = useMemo(
    () =>
      visibleCapabilities(
        capabilitiesForProblem(primaryProblemFor({
          resolution: focusCase,
          cases: workerCases,
          item: item ?? undefined,
          request,
          worker,
        }), {
          resolution: focusCase,
          cases: workerCases,
          item: item ?? undefined,
          request,
          worker,
        }),
      ),
    [focusCase, workerCases, item, request, worker],
  );

  function run(kind: AgenticActionKind) {
    if (!item) return;
    const slot = request?.requestedDocuments.find((entry) =>
      workerDocs.some(
        (doc) =>
          doc.requestedDocumentId === entry.id &&
          (doc.status === "missing" ||
            doc.status === "rejected" ||
            doc.status === "expired" ||
            focusCase?.issues.some(
              (issue) =>
                issue.state === "open" && issue.documentSubmissionId === doc.id,
            )),
      ),
    );
    switch (kind) {
      case "view_source_file": {
        const file = sourceFiles.find((entry) => entry.id === (focusCase?.sourceFileId ?? item.sourceFileId));
        if (file) onViewDocument({ sourceFile: file, document: { title: slot?.label } });
        return;
      }
      case "upload_file_for_slot":
      case "replace_uploaded_file":
        if (worker && slot) {
          openComposer({
            slot: {
              requestId: worker.requestId,
              workerSubmissionId: worker.id,
              requestedDocumentId: slot.id,
            },
          });
        }
        return;
      case "request_reupload":
        if (worker && slot && request) {
          const link = createReuploadLink({
            workerSubmissionId: worker.id,
            requestedDocumentId: slot.id,
          });
          if (link) {
            const text = reuploadMessage({
              recipientName: request.recipient.name,
              workerName: worker.submittedFullName,
              slotLabel: slot.label,
              token: link.token,
            });
            window.open(whatsappShareUrl(text), "_blank");
          }
        }
        return;
      case "approve_worker":
        if (worker) approveWorker(worker.id);
        return;
      case "share_whatsapp":
        if (request) window.open(whatsappShareUrl(request.messageHe), "_blank");
        return;
      case "share_email":
        if (request) {
          window.open(
            mailtoShareUrl({ subject: request.title, body: request.messageHe }),
            "_blank",
          );
        }
        return;
      case "copy_link":
        if (request) {
          void navigator.clipboard.writeText(publicRequestUrl(request.token));
          toast.success(copy.linkCopiedToast);
        }
        return;
      case "close_request":
        if (request) closeRequest(request.id);
        return;
      case "reopen_request":
        if (request) reopenRequest(request.id);
        return;
      case "extend_request_expiry":
        if (request) {
          const next = new Date(new Date(request.expiresAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          extendRequestExpiry(request.id, next);
        }
        return;
      case "confirm_no_expiry":
        if (focusCase) {
          const issue = focusCase.issues.find((entry) => entry.code === "validity_unknown");
          answerCase(focusCase.id, {
            type: "mark_no_expiry",
            issueId: issue?.id ?? focusCase.issues[0]?.id ?? "",
          });
        }
        return;
      case "enter_expiry_date":
        if (focusCase && dateValue) {
          const issue = focusCase.issues.find((entry) => entry.code === "validity_unknown");
          answerCase(focusCase.id, {
            type: "enter_value",
            issueId: issue?.id ?? focusCase.issues[0]?.id ?? "",
            field: "expiresOn",
            value: dateValue,
          });
        }
        return;
      case "edit_worker_name":
        if (focusCase && nameValue.trim()) {
          answerCase(focusCase.id, { type: "edit_worker_name", value: nameValue.trim() });
        }
        return;
      case "edit_worker_identity":
        if (focusCase && nameValue.trim()) {
          answerCase(focusCase.id, { type: "edit_worker_identity", value: nameValue.trim() });
        }
        return;
      case "confirm_slot_match":
      case "confirm_extracted_field":
      case "accept_document":
      case "reject_document":
      case "defer":
      case "resume":
        if (focusCase) {
          if (kind === "confirm_slot_match") answerCase(focusCase.id, { type: "confirm_slot_match" });
          else if (kind === "accept_document") answerCase(focusCase.id, { type: "accept_document" });
          else if (kind === "reject_document") answerCase(focusCase.id, { type: "reject_document" });
          else if (kind === "defer") answerCase(focusCase.id, { type: "defer" });
          else if (kind === "resume") answerCase(focusCase.id, { type: "resume" });
          else {
            const issue = focusCase.issues.find((entry) => entry.state === "open");
            if (issue) answerCase(focusCase.id, { type: "confirm_issue", issueId: issue.id });
          }
        }
        return;
      default:
        return;
    }
  }

  const open = Boolean(item);
  const body = item ? (
    <div className="grid gap-4 px-1 py-2">
      {worker ? (
        <div className="grid gap-2">
          <p className="text-[14px] font-semibold">{worker.submittedFullName}</p>
          {worker.submittedIdentityNumber ? (
            <p className="text-[13px] text-stone-500">{worker.submittedIdentityNumber}</p>
          ) : null}
          <ul className="grid gap-2">
            {request?.requestedDocuments
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((slot) => {
                const doc = workerDocs.find((entry) => entry.requestedDocumentId === slot.id);
                return (
                  <li
                    key={slot.id}
                    className="rounded-[16px] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
                  >
                    <p className="text-[14px] font-medium">{slot.label}</p>
                    <p className="text-[12.5px] text-stone-500">
                      {doc?.status === "accepted"
                        ? copy.slotAccepted
                        : doc?.status === "missing"
                          ? copy.slotMissing
                          : doc?.status === "needs_review"
                            ? copy.slotNeedsReview
                            : doc?.status === "rejected"
                              ? copy.slotRejected
                              : doc?.status === "expired"
                                ? copy.slotExpired
                                : doc?.status === "processing" || doc?.status === "uploaded"
                                  ? copy.slotProcessing
                                  : copy.slotMissing}
                    </p>
                  </li>
                );
              })}
          </ul>
        </div>
      ) : request ? (
        <div className="grid gap-2 text-[14px]">
          <p className="font-semibold">{request.title}</p>
          <p className="text-stone-500">
            {copy.recipientLabel}: {request.recipient.name}
          </p>
          <p className="whitespace-pre-wrap rounded-[16px] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            {request.messageHe}
          </p>
        </div>
      ) : (
        <p className="py-2 text-[14px] font-medium text-stone-600">{copy.continuingTreatment}</p>
      )}

      {caps.some((entry) => entry.kind === "edit_worker_name" || entry.kind === "edit_worker_identity") ? (
        <input
          className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 text-[15px]"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          placeholder={copy.formFullName}
        />
      ) : null}
      {caps.some((entry) => entry.kind === "enter_expiry_date") ? (
        <input
          type="date"
          className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 text-[15px]"
          value={dateValue}
          onChange={(event) => setDateValue(event.target.value)}
        />
      ) : null}

      <div className="grid gap-2">
        {caps.map((entry) => (
          <Button
            key={entry.kind}
            variant={entry.priority === "primary" ? "primary" : "secondary"}
            onClick={() => run(entry.kind)}
          >
            {entry.labelHe}
          </Button>
        ))}
      </div>
    </div>
  ) : null;

  const header = item ? (
    <ActivitySheetHeader item={item} personName={worker?.submittedFullName ?? request?.recipient.name} />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
        title={item?.titleHe ?? copy.reviewWorkspaceTitle}
        className={sheetDialogClassName}
        overlayClassName={sheetOverlayClassName}
        header={header}
      >
        <div className={sheetContentClassName}>{body}</div>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={item?.titleHe ?? copy.reviewWorkspaceTitle}
      className={sheetDrawerClassName}
      overlayClassName={sheetOverlayClassName}
      header={header}
    >
      <div className={sheetContentClassName}>{body}</div>
    </Drawer>
  );
}
