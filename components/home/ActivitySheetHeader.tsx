"use client";

import { CircleUserRound, Flag, RefreshCcwDot, Settings2, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { activityTypeLabels } from "@/lib/copy";
import type { ActivityItem, ActivityType } from "@/lib/types";

const typeIcons = {
  action: Settings2,
  alert: Flag,
  update: Zap,
  processing: RefreshCcwDot,
};

const typeDot: Record<ActivityType, string> = {
  action: "bg-[#0004FF] shadow-[0_0_6px_#0004FF]",
  alert: "bg-[#FF0048] shadow-[0_0_6px_#FF0048]",
  update: "bg-[#00FF62] shadow-[0_0_6px_#00FF62]",
  processing: "bg-[#2B2B2B] shadow-[0_0_6px_rgba(43,43,43,0.55)]",
};

export const sheetOverlayClassName =
  "bg-[#2B2B2B]/25 backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]";

export const sheetDrawerClassName = "max-h-[85dvh] bg-[#FFFDFB]";
export const sheetDialogClassName = "max-h-[85dvh] max-w-md bg-[#FFFDFB]";
export const sheetContentClassName = "max-h-[min(70dvh,calc(85dvh-7rem))]";

export function activityForSourceFile(
  items: ActivityItem[],
  sourceFileId: string,
): ActivityItem | undefined {
  return items.find((entry) => entry.sourceFileId === sourceFileId);
}

export function activityForJob(
  items: ActivityItem[],
  jobId: string | null | undefined,
): ActivityItem | undefined {
  if (!jobId) return undefined;
  return (
    items.find((entry) => entry.jobId === jobId && !entry.resolved) ??
    items.find((entry) => entry.jobId === jobId)
  );
}

type ActivitySheetHeaderProps = {
  item: ActivityItem;
  personName?: string;
};

/** Status row shared by every feed drawer: type on the start, name on the end. */
export function ActivitySheetHeader({
  item,
  personName,
}: ActivitySheetHeaderProps) {
  const TypeIcon = typeIcons[item.type];
  const name = personName;

  const person = name ? (
    <>
      <CircleUserRound
        className="size-4 shrink-0 text-[#2B2B2B]"
        aria-hidden
      />
      <span className="truncate text-[12px] font-medium text-[#2B2B2B]">
        {name}
      </span>
    </>
  ) : null;

  return (
    <div className="shrink-0 border-b border-[#2B2B2B]/20">
      <div className="flex items-center gap-2 px-5 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
        {person ? (
          <span className="flex max-w-[46%] shrink-0 items-center gap-1.5">
            {person}
          </span>
        ) : null}
      </div>
    </div>
  );
}
