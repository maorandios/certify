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
import {
  activityHasChevron,
  isActivityInteractive,
  type ActivityOpenContext,
} from "@/lib/activityOpen";
import { activityTypeLabels } from "@/lib/copy";
import { formatRelativeHe } from "@/lib/dates";
import { useMounted } from "@/components/ui/use-mounted";
import type {
  ActivityItem,
  ActivityType,
  Employee,
} from "@/lib/types";

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

/**
 * Relative time depends on Date.now(), so the server-rendered label drifts
 * from the client's. Rendering it only after mount avoids the hydration
 * mismatch that breaks React on production builds.
 */
function RelativeTime({ timestamp }: { timestamp: string }) {
  const mounted = useMounted();
  return (
    <time className="text-xs text-stone-400" suppressHydrationWarning>
      {mounted ? formatRelativeHe(timestamp) : ""}
    </time>
  );
}

type ActivityCardProps = {
  item: ActivityItem;
  employees: Employee[];
  openContext: ActivityOpenContext;
  isLast?: boolean;
  onPostPress: (item: ActivityItem) => void;
};

export function ActivityCard({
  item,
  employees,
  isLast = false,
  openContext,
  onPostPress,
}: ActivityCardProps) {
  const employee = employees.find((entry) => entry.id === item.employeeId);
  const related = (item.relatedEmployeeIds ?? [])
    .map((id) => employees.find((entry) => entry.id === id))
    .filter((entry): entry is Employee => Boolean(entry));
  const TypeIcon = typeIcons[item.type];
  const interactive = isActivityInteractive(item, openContext);
  const showChevron = activityHasChevron(item, openContext);

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

          {employee ? (
            <span className="mt-0.5 inline-flex min-w-0 max-w-[55%] items-center gap-1">
              <CircleUserRound className="size-3 shrink-0 text-stone-500" aria-hidden />
              <span className="truncate text-[11.55px] font-medium leading-4 text-stone-500">
                {employee.fullName}
              </span>
            </span>
          ) : null}

          {related.length > 0 && !employee && item.metadataHe ? (
            <p className={cn("mt-0.5 truncate", metaText)}>{item.metadataHe}</p>
          ) : null}

          {!employee && item.metadataHe && related.length === 0 ? (
            <p className={cn("mt-0.5", metaText)}>{item.metadataHe}</p>
          ) : null}
        </div>
        {showChevron ? (
          <ArrowLeft className="size-5 shrink-0 text-stone-500" aria-hidden />
        ) : null}
      </div>
    </li>
  );
}
