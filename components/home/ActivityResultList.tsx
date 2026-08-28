"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { copy, documentTypeLabels, lifecycleLabels } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import type { ActivityItem, DocumentRecord } from "@/lib/types";
import { ResponsiveSheet } from "@/components/ui/sheet";
import {
  ActivitySheetHeader,
  sheetContentClassName,
  sheetDialogClassName,
  sheetDrawerClassName,
} from "./ActivitySheetHeader";

type ActivityResultListProps = {
  item: ActivityItem | null;
  onClose: () => void;
  onSelect: (document: DocumentRecord) => void;
};

export function ActivityResultList({
  item,
  onClose,
  onSelect,
}: ActivityResultListProps) {
  const [held, setHeld] = useState(item);
  if (item && held?.id !== item.id) {
    setHeld(item);
  }
  const display = item ?? held;
  if (!display) return null;

  return (
    <ResultBody
      key={display.id}
      item={display}
      open={item != null}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}

function ResultBody({
  item,
  open,
  onClose,
  onSelect,
}: {
  item: ActivityItem;
  open: boolean;
  onClose: () => void;
  onSelect: (document: DocumentRecord) => void;
}) {
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const employee = employees.find((entry) => entry.id === item.employeeId);

  const items = (item.relatedDocumentIds ?? [])
    .map((id) => documents.find((entry) => entry.id === id))
    .filter((entry): entry is DocumentRecord => Boolean(entry));

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={copy.resultListTitle}
      titleHidden
      drawerClassName={sheetDrawerClassName}
      contentClassName={sheetContentClassName}
      dialogClassName={sheetDialogClassName}
      header={
        <ActivitySheetHeader item={item} employee={employee} />
      }
    >
      {items.length === 0 ? (
        <p className="py-2 text-sm text-stone-500">{copy.resultListEmpty}</p>
      ) : (
        <ul className="grid gap-1.5 pb-1">
          {items.map((document) => {
            const owner = employees.find(
              (entry) => entry.id === document.employeeId,
            );
            return (
              <li key={document.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelect(document);
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-3.5 text-start"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold">
                      {documentTypeLabels[document.typeId]}
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-stone-500">
                      {[
                        owner?.fullName,
                        lifecycleLabels[document.lifecycle],
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <ArrowLeft className="size-5 shrink-0 text-stone-400" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ResponsiveSheet>
  );
}
