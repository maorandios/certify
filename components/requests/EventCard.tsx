"use client";

import {
  ArrowLeft,
  CircleDashed,
  CircleDot,
  CircleDotDashed,
  CircleUserRound,
  CircleX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { eventStatusLabels } from "@/lib/copy";
import { formatRelativeHe } from "@/lib/dates";
import type { EventListStatus } from "@/lib/requests/types";
import type { DocumentRequest } from "@/lib/types";

const statusIcons: Record<EventListStatus, LucideIcon> = {
  open: CircleDashed,
  in_progress: CircleDotDashed,
  completed: CircleDot,
  cancelled: CircleX,
};

const statusDot: Record<EventListStatus, string> = {
  open: "bg-[#FF5900] shadow-[0_0_6px_#FF5900]",
  in_progress: "bg-[#0004FF] shadow-[0_0_6px_#0004FF]",
  completed: "bg-[#00FF62] shadow-[0_0_6px_#00FF62]",
  cancelled: "bg-[#2B2B2B] shadow-[0_0_6px_rgba(43,43,43,0.55)]",
};

const metaText = "text-[12px] font-normal leading-4 text-stone-500";

type EventCardProps = {
  request: DocumentRequest;
  status: EventListStatus;
  now: Date;
  isLast?: boolean;
  active?: boolean;
  onPress: (request: DocumentRequest) => void;
};

export function EventCard({
  request,
  status,
  now,
  isLast = false,
  active = false,
  onPress,
}: EventCardProps) {
  const StatusIcon = statusIcons[status];

  return (
    <li className="flex gap-3">
      <div className="flex w-4 shrink-0 flex-col items-center" aria-hidden>
        <span className="flex h-5 w-4 items-center justify-center">
          <StatusIcon className="size-4 text-[#2B2B2B]" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => onPress(request)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-4 text-start",
          isLast ? "pb-1" : "pb-6",
          active && "-mx-2 rounded-2xl bg-stone-50 px-2",
        )}
      >
        <div className="min-w-0 flex-1">
          <header className="flex h-5 min-w-0 items-center gap-1.5">
            <span
              className={cn("size-1.5 shrink-0 rounded-full", statusDot[status])}
              aria-hidden
            />
            <span className="text-[12px] font-medium text-[#2B2B2B]">
              {eventStatusLabels[status]}
            </span>
            <span className="text-stone-300" aria-hidden>
              ·
            </span>
            <time className="text-xs text-stone-400">
              {formatRelativeHe(request.createdAt, now)}
            </time>
          </header>

          <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-6">
            {request.title}
          </h3>

          <span className="mt-0.5 inline-flex min-w-0 max-w-[80%] items-center gap-1">
            <CircleUserRound className="size-3 shrink-0 text-stone-500" aria-hidden />
            <span className={cn("truncate", metaText)}>{request.recipient.name}</span>
          </span>
        </div>
        <ArrowLeft className="size-5 shrink-0 text-stone-500" aria-hidden />
      </button>
    </li>
  );
}
