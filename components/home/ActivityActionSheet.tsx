"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleUserRound,
  Copy as CopyIcon,
  Eye,
  FileText,
  Flag,
  ImageIcon,
  Loader2,
  RefreshCcwDot,
  Settings2,
  Upload,
  UserRoundPlus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { activityTypeLabels, copy, documentTypeLabels, uploadStageLabels } from "@/lib/copy";
import { formatDotDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import type { ActivityItem, DocumentRecord } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { EmployeeFormSheet } from "@/components/employees/EmployeeFormSheet";
import { RenewRequestSheet } from "@/components/requests/RenewRequestSheet";

const typeIcons = {
  action: Settings2,
  alert: Flag,
  update: Zap,
  processing: RefreshCcwDot,
};

const typeDot: Record<ActivityItem["type"], string> = {
  action: "bg-[#0004FF] shadow-[0_0_6px_#0004FF]",
  alert: "bg-[#FF0048] shadow-[0_0_6px_#FF0048]",
  update: "bg-[#00FF62] shadow-[0_0_6px_#00FF62]",
  processing: "bg-[#2B2B2B] shadow-[0_0_6px_rgba(43,43,43,0.55)]",
};

const overlayClassName =
  "bg-[#2B2B2B]/25 backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]";

type ActivityActionSheetProps = {
  item: ActivityItem | null;
  onClose: () => void;
};

export function ActivityActionSheet({ item, onClose }: ActivityActionSheetProps) {
  // Keep the last item mounted so the drawer can play its closing slide.
  const [held, setHeld] = useState(item);
  if (item && held?.id !== item.id) {
    setHeld(item);
  }
  const display = item ?? held;
  if (!display) return null;
  return (
    <SheetBody
      key={display.id}
      item={display}
      open={item != null}
      onClose={onClose}
    />
  );
}

function SheetBody({
  item,
  open,
  onClose,
}: {
  item: ActivityItem;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const jobs = useAppStore((state) => state.jobs);
  const openComposer = useAppStore((state) => state.openComposer);
  const openJobsSheet = useAppStore((state) => state.openJobsSheet);
  const assignActivityToEmployee = useAppStore(
    (state) => state.assignActivityToEmployee,
  );
  const confirmActivityField = useAppStore(
    (state) => state.confirmActivityField,
  );
  const decideReplacement = useAppStore((state) => state.decideReplacement);

  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [fixValue, setFixValue] = useState("");

  const employee = employees.find((entry) => entry.id === item.employeeId);
  const document = documents.find((entry) => entry.id === item.documentId);
  const pendingDocument = documents.find(
    (entry) => entry.id === item.pendingDocumentId,
  );
  const job = jobs.find((entry) => entry.id === item.jobId);
  const kind = item.action?.kind;

  const candidates = useMemo(() => {
    if (!item.candidateEmployeeIds) return [];
    return item.candidateEmployeeIds
      .map((id) => employees.find((entry) => entry.id === id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [item, employees]);

  const prefill = job?.extracted
    ? {
        fullName: job.extracted.fullName,
        identityNumber: job.extracted.identityNumber.replace(/\D/g, ""),
      }
    : undefined;

  function goToEmployee(id: string) {
    onClose();
    router.push(`/employees/${id}`);
  }

  const isDuplicateDecision = job?.outcome === "possible_duplicate";

  return (
    <>
      <ResponsiveSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={item.titleHe}
        titleHidden
        overlayClassName={overlayClassName}
        drawerClassName="min-h-[53svh] max-h-[78svh] bg-[#FEF6F2]"
        contentClassName="max-h-none min-h-0 flex-1"
        dialogClassName="max-h-[82vh] min-h-[50vh] max-w-xl bg-[#FEF6F2]"
        header={<EventTypeHeader item={item} />}
      >
        <div className="grid gap-4 pb-1">
          <header>
            <h2 className="text-[17px] font-semibold leading-6">
              {item.titleHe}
            </h2>
            {item.metadataHe ? (
              <p className="mt-1 text-[13px] text-stone-500">{item.metadataHe}</p>
            ) : null}
          </header>

          {/* Related employee */}
          {employee ? (
            <button
              type="button"
              onClick={() => goToEmployee(employee.id)}
              className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-start"
            >
              <Avatar
                name={employee.fullName}
                src={employee.profileImage}
                size="sm"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-stone-500">
                  {copy.sheetRelatedEmployee}
                </span>
                <span className="block truncate text-[14px] font-semibold">
                  {employee.fullName}
                </span>
              </span>
              <Eye className="size-4 shrink-0 text-stone-400" aria-hidden />
            </button>
          ) : null}

          {/* Related document */}
          {document ? (
            <button
              type="button"
              onClick={() => setViewerDoc(document)}
              className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 text-start"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-stone-500"
                aria-hidden
              >
                {document.fileMeta.previewKind === "pdf" ? (
                  <FileText className="size-4.5" />
                ) : (
                  <ImageIcon className="size-4.5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-stone-500">
                  {copy.sheetRelatedDocument}
                </span>
                <span className="block truncate text-[14px] font-semibold">
                  {documentTypeLabels[document.typeId]}
                  {document.expiresOn
                    ? ` · עד ${formatDotDate(document.expiresOn)}`
                    : ""}
                </span>
              </span>
              <Eye className="size-4 shrink-0 text-stone-400" aria-hidden />
            </button>
          ) : null}

          {/* Extracted evidence */}
          {item.evidenceHe ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-3.5 py-3">
              <p className="text-[12px] font-medium text-stone-500">
                {copy.sheetEvidence}
              </p>
              <p className="mt-1 text-[14px] leading-6">{item.evidenceHe}</p>
            </div>
          ) : null}

          {/* Decision area per action kind */}
          {kind === "select_employee" ? (
            <div className="grid gap-2">
              <p className="text-[13px] font-medium text-stone-600">
                {copy.selectEmployeeHint}
              </p>
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    assignActivityToEmployee(item.id, candidate.id);
                    onClose();
                  }}
                  className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-3.5 text-start transition-colors hover:border-[var(--color-brand)] active:bg-stone-50"
                >
                  <Avatar
                    name={candidate.fullName}
                    src={candidate.profileImage}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold">
                      {candidate.fullName}
                    </span>
                    <span className="block text-[12px] text-stone-500" dir="ltr">
                      {candidate.identityNumber}
                    </span>
                  </span>
                </button>
              ))}
              <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                <UserRoundPlus className="size-4" aria-hidden />
                {copy.createNewEmployeeAction}
              </Button>
            </div>
          ) : null}

          {kind === "create_employee" ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserRoundPlus className="size-4" aria-hidden />
              {copy.createNewEmployeeAction}
            </Button>
          ) : null}

          {kind === "confirm_field" ? (
            <div className="grid gap-2.5">
              {document?.expiresOn ? (
                <div className="flex items-baseline justify-between rounded-2xl bg-white px-3.5 py-2.5">
                  <span className="text-[13px] text-stone-500">
                    {copy.confirmFieldExtracted}
                  </span>
                  <span className="text-[14px] font-semibold">
                    {formatDotDate(document.expiresOn)}
                  </span>
                </div>
              ) : null}
              <div className="flex gap-2">
                <input
                  type="date"
                  className="min-h-11 flex-1 rounded-2xl border border-[var(--line)] bg-white px-3 text-[15px] outline-none focus:border-[var(--color-brand)]"
                  value={fixValue}
                  onChange={(event) => setFixValue(event.target.value)}
                  aria-label={copy.confirmFieldTitle}
                />
                <Button
                  disabled={!fixValue && !document?.expiresOn}
                  onClick={() => {
                    confirmActivityField(
                      item.id,
                      fixValue || document?.expiresOn || "",
                    );
                    onClose();
                  }}
                >
                  {fixValue ? copy.confirmFieldFix : copy.confirmFieldConfirm}
                </Button>
              </div>
            </div>
          ) : null}

          {kind === "replace_file" ? (
            <Button
              onClick={() => {
                openComposer({
                  resolvesActivityId: item.id,
                  target: item.employeeId
                    ? { employeeId: item.employeeId }
                    : undefined,
                });
                onClose();
              }}
            >
              <Upload className="size-4" aria-hidden />
              {copy.replaceFileAction}
            </Button>
          ) : null}

          {kind === "confirm_replacement" && pendingDocument ? (
            <div className="grid gap-2.5">
              <div className="grid gap-1.5 rounded-2xl bg-white px-3.5 py-3 text-[13.5px]">
                {document ? (
                  <p className="flex justify-between gap-3">
                    <span className="text-stone-500">המסמך הקיים</span>
                    <span className="font-medium">
                      {document.credentialNumber ?? documentTypeLabels[document.typeId]}
                      {document.expiresOn
                        ? ` · עד ${formatDotDate(document.expiresOn)}`
                        : ""}
                    </span>
                  </p>
                ) : null}
                <p className="flex justify-between gap-3">
                  <span className="text-stone-500">המסמך החדש</span>
                  <span className="font-medium">
                    {pendingDocument.credentialNumber ??
                      documentTypeLabels[pendingDocument.typeId]}
                    {pendingDocument.expiresOn
                      ? ` · עד ${formatDotDate(pendingDocument.expiresOn)}`
                      : ""}
                  </span>
                </p>
              </div>
              {isDuplicateDecision ? (
                <>
                  <Button
                    onClick={() => {
                      decideReplacement(item.id, "discard");
                      onClose();
                    }}
                  >
                    {copy.discardDuplicateAction}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      decideReplacement(item.id, "keep_both");
                      onClose();
                    }}
                  >
                    {copy.keepSeparateAction}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      decideReplacement(item.id, "replace");
                      onClose();
                    }}
                  >
                    {copy.replacePreviousAction}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      decideReplacement(item.id, "keep_both");
                      onClose();
                    }}
                  >
                    {copy.keepBothAction}
                  </Button>
                </>
              )}
            </div>
          ) : null}

          {kind === "renew_document" && employee ? (
            <Button onClick={() => setRenewOpen(true)}>
              <CopyIcon className="size-4" aria-hidden />
              {item.action?.labelHe ?? "שליחת בקשת חידוש"}
            </Button>
          ) : null}

          {kind === "view_result" ? (
            <Button
              onClick={() => {
                if (document) setViewerDoc(document);
                else if (employee) goToEmployee(employee.id);
                else onClose();
              }}
            >
              <Eye className="size-4" aria-hidden />
              {copy.viewResultAction}
            </Button>
          ) : null}

          {/* Processing events: peek into the jobs sheet */}
          {item.type === "processing" ? (
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                openJobsSheet();
              }}
            >
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {copy.openProcessing}
            </Button>
          ) : null}

          {/* Job progress hint for pending decisions */}
          {job && job.stage === "action_required" ? (
            <p className="text-center text-[12px] text-stone-400">
              {job.fileMeta.name} · {uploadStageLabels[job.stage]}
            </p>
          ) : null}

          {/* Fallback secondary: open the employee page */}
          {!kind && item.type !== "processing" && employee ? (
            <Button variant="secondary" onClick={() => goToEmployee(employee.id)}>
              <CircleUserRound className="size-4" aria-hidden />
              {copy.viewEmployee}
            </Button>
          ) : null}
        </div>
      </ResponsiveSheet>

      <DocumentViewer document={viewerDoc} onClose={() => setViewerDoc(null)} />

      <EmployeeFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        prefill={prefill}
        activityId={item.id}
        onSaved={() => onClose()}
      />

      {employee ? (
        <RenewRequestSheet
          open={renewOpen}
          onClose={() => {
            setRenewOpen(false);
            onClose();
          }}
          employeeId={employee.id}
          documentId={item.documentId}
          activityId={item.id}
        />
      ) : null}
    </>
  );
}

function EventTypeHeader({ item }: { item: ActivityItem }) {
  const TypeIcon = typeIcons[item.type];

  return (
    <div className="shrink-0 border-b border-[#2B2B2B]/20">
      <div className="flex items-center gap-1.5 px-5 pt-3 pb-4">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", typeDot[item.type])}
          aria-hidden
        />
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center",
            item.type === "processing" && "animate-cycle",
          )}
          aria-hidden
        >
          <TypeIcon className="size-4 text-[#2B2B2B]" />
        </span>
        <span className="text-[12px] font-medium text-[#2B2B2B]">
          {activityTypeLabels[item.type]}
        </span>
      </div>
    </div>
  );
}
