import {
  ClockFading,
  OctagonX,
  SquareDashedMousePointer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DocumentAttention } from "@/lib/status";

type DocumentPulseProps = {
  attention: DocumentAttention;
  activeCount: number;
};

export function DocumentPulse({
  attention,
  activeCount,
}: DocumentPulseProps) {
  const total = Math.max(activeCount, 1);

  return (
    <section
      aria-label="מצב מסמכים"
      className="grid min-h-[168px] w-full grid-cols-3 rounded-[52px] bg-[#2B2B2B] px-2 py-7"
    >
      <Segment
        icon={OctagonX}
        label="פגי תוקף"
        value={attention.expired}
        total={total}
      />
      <Segment
        icon={ClockFading}
        label="לקראת פג תוקף"
        value={attention.expiring}
        total={total}
        divider
      />
      <Segment
        icon={SquareDashedMousePointer}
        label="נדרש בדיקה"
        value={attention.needsReview}
        total={total}
        divider
      />
    </section>
  );
}

function Segment({
  icon: Icon,
  label,
  value,
  total,
  divider = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  total: number;
  divider?: boolean;
}) {
  const active = value > 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 px-2 text-center",
        divider && "border-s border-[#FEF6F2]/12",
      )}
    >
      <ProgressRing value={value} max={total} />
      <div className="flex items-center justify-center gap-1">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            active ? "text-[#FEF6F2]/80" : "text-[#FEF6F2]/35",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        <p
          className={cn(
            "text-[11px] font-medium leading-4",
            active ? "text-[#FEF6F2]/80" : "text-[#FEF6F2]/40",
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const size = 64;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - progress);

  return (
    <div className="relative size-[64px] shrink-0" aria-hidden>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(254,246,242,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FF5900"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="drop-shadow-[0_0_5px_rgba(255,89,0,0.9)]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold tabular-nums text-[#FEF6F2]">
        {value}/{max}
      </span>
    </div>
  );
}
