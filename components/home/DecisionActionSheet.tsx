"use client";

import { useMemo, useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { copy, documentTypeLabels, sheetInsightHe } from "@/lib/copy";
import { formatDotDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import type { ActivityItem } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { EmployeeFormSheet } from "@/components/employees/EmployeeFormSheet";
import {
  ActivitySheetHeader,
  sheetContentClassName,
  sheetDialogClassName,
  sheetDrawerClassName,
} from "./ActivitySheetHeader";

type DecisionActionSheetProps = {
  item: ActivityItem | null;
  onClose: () => void;
};

export function DecisionActionSheet({
  item,
  onClose,
}: DecisionActionSheetProps) {
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

function decisionTitle(item: ActivityItem): string {
  switch (item.actionKind) {
    case "select_employee":
      return copy.selectEmployeeTitle;
    case "confirm_field":
      return item.fieldKey === "expiresOn"
        ? copy.confirmExpiryTitle
        : copy.confirmFieldTitle;
    case "confirm_replacement":
      return copy.decisionReplacementTitle;
    default:
      return copy.postActionsTitle;
  }
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
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const jobs = useAppStore((state) => state.jobs);
  const assignActivityToEmployee = useAppStore(
    (state) => state.assignActivityToEmployee,
  );
  const confirmActivityField = useAppStore(
    (state) => state.confirmActivityField,
  );
  const decideReplacement = useAppStore((state) => state.decideReplacement);

  const [createOpen, setCreateOpen] = useState(false);
  const [fixValue, setFixValue] = useState("");

  const employee = employees.find((entry) => entry.id === item.employeeId);
  const document = documents.find((entry) => entry.id === item.documentId);
  const pendingDocument = documents.find(
    (entry) => entry.id === item.pendingDocumentId,
  );
  const job = jobs.find((entry) => entry.id === item.jobId);
  const kind = item.actionKind;
  const explanation = sheetInsightHe(item);

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

  const documentLabel = document
    ? documentTypeLabels[document.typeId]
    : pendingDocument
      ? documentTypeLabels[pendingDocument.typeId]
      : item.metadataHe;

  const isDuplicateDecision = job?.outcome === "possible_duplicate";

  return (
    <>
      <ResponsiveSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={decisionTitle(item)}
        titleHidden
        drawerClassName={sheetDrawerClassName}
        contentClassName={sheetContentClassName}
        dialogClassName={sheetDialogClassName}
        header={
          <ActivitySheetHeader
            item={item}
            employee={employee}
            employeeName={job?.extracted?.fullName}
          />
        }
      >
        <div className="grid gap-3 pb-1">
          {explanation ? (
            <p className="text-[14px] leading-6 text-[#2B2B2B]">{explanation}</p>
          ) : null}

          {documentLabel ? (
            <p className="text-[13px] text-stone-500">{documentLabel}</p>
          ) : null}

          {kind === "confirm_field" ? (
            <div className="grid gap-2.5">
              <div className="overflow-hidden rounded-2xl bg-stone-200/70">
                <div className="flex h-16 items-center justify-center text-[12px] text-stone-500">
                  {copy.evidenceCropLabel}
                  {item.fieldKey === "expiresOn" ? " · תאריך תוקף" : ""}
                </div>
              </div>
              {item.evidenceHe ? (
                <p className="text-[13px] leading-5 text-stone-500">
                  {item.evidenceHe}
                </p>
              ) : null}
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

          {kind === "select_employee" ? (
            <div className="grid gap-2">
              {item.evidenceHe ? (
                <p className="text-[13px] leading-5 text-stone-500">
                  {item.evidenceHe}
                </p>
              ) : null}
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

          {kind === "confirm_replacement" && pendingDocument ? (
            <div className="grid gap-2.5">
              {item.evidenceHe ? (
                <p className="text-[13px] leading-5 text-stone-500">
                  {item.evidenceHe}
                </p>
              ) : null}
              <div className="grid gap-1.5 rounded-2xl bg-white px-3.5 py-3 text-[13.5px]">
                {document ? (
                  <p className="flex justify-between gap-3">
                    <span className="text-stone-500">המסמך הקיים</span>
                    <span className="font-medium">
                      {document.credentialNumber ??
                        documentTypeLabels[document.typeId]}
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
        </div>
      </ResponsiveSheet>

      <EmployeeFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        prefill={prefill}
        activityId={item.id}
        activity={item}
        onSaved={() => onClose()}
      />
    </>
  );
}
