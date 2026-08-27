"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleUserRound,
  Ellipsis,
  FileText,
  Hand,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { activityTypeLabels, documentTypeLabels } from "@/lib/copy";
import { formatRelativeHe } from "@/lib/dates";
import { isExpiringAlert } from "@/lib/activity";
import type {
  ActivityActionKind,
  ActivityItem,
  ActivityType,
  DocumentRecord,
  Employee,
} from "@/lib/types";

const typeIcons = {
  action: Hand,
  alert: AlertTriangle,
  update: CheckCircle2,
  processing: Loader2,
};

const typeLabel: Record<ActivityType, string> = {
  action: "text-orange-600",
  alert: "text-[var(--status-bad)]",
  update: "text-[var(--color-brand)]",
  processing: "text-[var(--color-brand)]",
};

const metaText = "text-[12px] font-normal leading-4 text-stone-500";

const typeRing: Record<ActivityType, string> = {
  action: "ring-orange-300",
  alert: "ring-red-300",
  update: "ring-teal-300",
  processing: "ring-teal-300",
};

type ActivityCardProps = {
  item: ActivityItem;
  employees: Employee[];
  documents: DocumentRecord[];
  progress?: number;
  isLast?: boolean;
  onAction: (kind: ActivityActionKind) => void;
  onEmployeePress: (employee: Employee) => void;
  onPostActionsPress: (item: ActivityItem) => void;
};

export function ActivityCard({
  item,
  employees,
  documents,
  progress = 0,
  isLast = false,
  onAction,
  onEmployeePress,
  onPostActionsPress,
}: ActivityCardProps) {
  const employee = employees.find((entry) => entry.id === item.employeeId);
  const related = (item.relatedEmployeeIds ?? [])
    .map((id) => employees.find((entry) => entry.id === id))
    .filter((entry): entry is Employee => Boolean(entry));
  const document = documents.find((entry) => entry.id === item.documentId);
  const expiring = isExpiringAlert(item, documents);
  const clickable = item.type === "processing";
  const labelColor =
    item.type === "alert" && expiring ? "text-[var(--status-warn)]" : typeLabel[item.type];
  const TypeIcon = typeIcons[item.type];
  const ringColor =
    item.type === "alert" && expiring ? "ring-amber-300" : typeRing[item.type];

  return (
    <li className="flex gap-3">
      <div className="flex w-7 shrink-0 flex-col items-center" aria-hidden>
        <span
          className={cn(
            "relative z-10 flex size-7 items-center justify-center rounded-full bg-transparent ring-1",
            ringColor,
          )}
        >
          <TypeIcon
            className={cn(
              "size-3.5",
              labelColor,
              item.type === "processing" && "animate-spin",
            )}
          />
        </span>
        {isLast ? null : <span className="w-px flex-1 bg-stone-200" />}
      </div>
      <article
        className={cn("min-w-0 flex-1", isLast ? "pb-1" : "pb-6", clickable && "cursor-pointer")}
        onClick={clickable ? () => onAction("openJobs") : undefined}
      >
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn("text-[12px] font-medium", labelColor)}>
              {activityTypeLabels[item.type]}
            </span>
            <span className="text-stone-300" aria-hidden>
              ·
            </span>
            <time className="text-xs text-stone-400">
              {formatRelativeHe(item.timestamp)}
            </time>
          </div>
          <button
            type="button"
            aria-label="פעולות"
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-transparent text-stone-700 ring-1 ring-stone-600"
            onClick={(event) => {
              event.stopPropagation();
              onPostActionsPress(item);
            }}
          >
            <Ellipsis className="size-3.5" aria-hidden />
          </button>
        </header>

        <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-6">
          {item.titleHe}
        </h3>

        {employee || document ? (
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            {employee ? (
              <button
                type="button"
                className="inline-flex min-w-0 max-w-[55%] items-center gap-1 appearance-none border-0 bg-transparent p-0 text-start"
                onClick={(event) => {
                  event.stopPropagation();
                  onEmployeePress(employee);
                }}
              >
                <CircleUserRound className="size-3 shrink-0 text-stone-500" aria-hidden />
                <span className="truncate text-[11px] font-normal leading-4 text-stone-500">
                  {employee.fullName}
                </span>
              </button>
            ) : null}
            {employee && document ? (
              <span className="shrink-0 text-stone-300" aria-hidden>
                ·
              </span>
            ) : null}
            {document ? (
              <p className={cn("flex min-w-0 items-center gap-1", metaText)}>
                <FileText className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{documentTypeLabels[document.typeId]}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {related.length > 0 && !employee && item.metadataHe ? (
          <p className={cn("mt-0.5 truncate", metaText)}>{item.metadataHe}</p>
        ) : null}

        {!employee && !document && item.metadataHe && related.length === 0 ? (
          <p className={cn("mt-0.5", metaText)}>{item.metadataHe}</p>
        ) : null}

        {item.type === "processing" ? (
          <div className="mt-2 h-0.5 max-w-40 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-[var(--color-brand)] transition-all"
              style={{ width: `${Math.max(12, Math.round(progress * 100))}%` }}
            />
          </div>
        ) : null}
      </article>
    </li>
  );
}
