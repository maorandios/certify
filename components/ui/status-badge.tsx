import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { statusBadgeLabels, statusLabels } from "@/lib/copy";
import type { RequestListBadge } from "@/lib/requests/types";

const icons = {
  unopened: FileQuestion,
  active: CheckCircle2,
  closed: Clock,
  expired: AlertCircle,
  revoked: HelpCircle,
};

const tones: Record<RequestListBadge, string> = {
  unopened: "bg-[var(--status-empty-soft)] text-[var(--status-empty)]",
  active: "bg-[var(--status-ok-soft)] text-[var(--status-ok)]",
  closed: "bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
  expired: "bg-[var(--status-bad-soft)] text-[var(--status-bad)]",
  revoked: "bg-[var(--status-review-soft)] text-[var(--status-review)]",
};

type StatusBadgeProps = {
  status: RequestListBadge;
  compact?: boolean;
  className?: string;
};

export function StatusBadge({ status, compact, className }: StatusBadgeProps) {
  const Icon = icons[status];
  const label = compact ? statusBadgeLabels[status] : statusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[status],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
