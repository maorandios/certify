import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileQuestion,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { statusBadgeLabels, statusLabels } from "@/lib/copy";
import type { EmployeeDocumentStatus } from "@/lib/types";

const icons = {
  current: CheckCircle2,
  expiring: Clock,
  expired: AlertCircle,
  needs_review: HelpCircle,
  no_documents: FileQuestion,
};

const tones: Record<EmployeeDocumentStatus, string> = {
  current: "bg-[var(--status-ok-soft)] text-[var(--status-ok)]",
  expiring: "bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
  expired: "bg-[var(--status-bad-soft)] text-[var(--status-bad)]",
  needs_review: "bg-[var(--status-review-soft)] text-[var(--status-review)]",
  no_documents: "bg-[var(--status-empty-soft)] text-[var(--status-empty)]",
};

type StatusBadgeProps = {
  status: EmployeeDocumentStatus;
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

