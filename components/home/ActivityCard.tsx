"use client";

import {
  ArrowLeft,
  CircleUserRound,
  Flag,
  RefreshCcwDot,
  Settings2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { activityHasChevron, isActivityInteractive } from "@/lib/activityOpen";
import { activityTypeLabels } from "@/lib/copy";
import { formatRelativeHe } from "@/lib/dates";
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

const metaText = "text-[12px] font-normal leading-4 text-stone-500";

function RelativeTime({ timestamp }: { timestamp: string }) {
  return (
    <time className="text-xs text-stone-400">
      {formatRelativeHe(timestamp)}
    </time>
  );
}

type ActivityCardProps = {
  item: ActivityItem;
  isLast?: boolean;
  onPostPress: (item: ActivityItem) => void;
};

export function ActivityCard({
  item,
  isLast = false,
  onPostPress,
}: ActivityCardProps) {
  const TypeIcon = typeIcons[item.type];
  const interactive = isActivityInteractive(item);
  const showChevron = activityHasChevron(item);

  function activate() {
    if (!interactive) return;
    onPostPress(item);
  }

  return (
    <li className="flex gap-3">
      <div className="flex w-4 shrink-0 flex-col items-center" aria-hidden>
        <span
          className={cn(
            "flex h-5 w-4 items-center justify-center",
            item.type === "processing" && "animate-cycle",
          )}
        >
          <TypeIcon className="size-4 text-[#2B2B2B]" />
        </span>
        {isLast ? null : (
          <span className="my-1.5 w-px flex-1 bg-stone-200" />
        )}
      </div>
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        data-qa-scenario={item.qaScenarioId}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-4 text-start",
          isLast ? "pb-1" : "pb-6",
          interactive && "cursor-pointer",
        )}
        onClick={interactive ? activate : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  activate();
                }
              }
            : undefined
        }
      >
        <div className="min-w-0 flex-1">
          <header className="flex h-5 min-w-0 items-center gap-1.5">
            <span
              className={cn("size-1.5 shrink-0 rounded-full", typeDot[item.type])}
              aria-hidden
            />
            <span className="text-[12px] font-medium text-[#2B2B2B]">
              {activityTypeLabels[item.type]}
            </span>
            <span className="text-stone-300" aria-hidden>
              ·
            </span>
            <RelativeTime timestamp={item.timestamp} />
          </header>

          <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-6">
            {item.titleHe}
          </h3>

          {item.metadataHe ? (
            <span className="mt-0.5 inline-flex min-w-0 max-w-[80%] items-center gap-1">
              <CircleUserRound className="size-3 shrink-0 text-stone-500" aria-hidden />
              <span className={cn("truncate", metaText)}>{item.metadataHe}</span>
            </span>
          ) : null}
        </div>
        {showChevron ? (
          <ArrowLeft className="size-5 shrink-0 text-stone-500" aria-hidden />
        ) : null}
      </div>
    </li>
  );
}
