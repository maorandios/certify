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
      className="grid min-h-[168px] w-full grid-cols-3 overflow-visible rounded-[52px] bg-[#2B2B2B] px-3 py-7"
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
        divider && "border-s border-[#FFFDFB]/12",
      )}
    >
      <ProgressRing value={value} max={total} />
      <div className="flex items-center justify-center gap-1">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            active ? "text-[#FFFDFB]/80" : "text-[#FFFDFB]/35",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
        <p
          className={cn(
            "text-[11px] font-medium leading-4",
            active ? "text-[#FFFDFB]/80" : "text-[#FFFDFB]/40",
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function ProgressRing({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const size = 64;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - progress);
  const cx = size / 2;
  const arc = {
    cx,
    cy: cx,
    r: radius,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeDasharray: circumference,
    strokeDashoffset: offset,
  };

  return (
    <div className="relative size-[64px] shrink-0 overflow-visible" aria-hidden>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        overflow="visible"
      >
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="rgba(255,253,251,0.16)"
            strokeWidth={stroke}
          />
        </g>
      </svg>
      {progress > 0 ? (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          overflow="visible"
          className="pointer-events-none absolute inset-0"
          style={{
            filter:
              "drop-shadow(0 0 3px #FF5900) drop-shadow(0 0 8px rgba(255,89,0,0.7))",
          }}
        >
          <g transform={`rotate(-90 ${cx} ${cx})`}>
            <circle {...arc} stroke="#FF5900" strokeWidth={9} strokeOpacity={0.28} />
            <circle {...arc} stroke="#FF5900" strokeWidth={stroke} />
          </g>
        </svg>
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold tabular-nums text-[#FFFDFB]">
        {value}/{max}
      </span>
    </div>
  );
}
