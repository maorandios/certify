import {
  ClockFading,
  OctagonX,
  SquareDashedMousePointer,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { attentionTotal, type DocumentAttention } from "@/lib/status";

type DocumentPulseProps = {
  attention: DocumentAttention;
  userCount: number;
  activeCount: number;
};

export function DocumentPulse({
  attention,
  userCount,
  activeCount,
}: DocumentPulseProps) {
  const needing = attentionTotal(attention);
  const healthy = Math.max(0, activeCount - needing);

  return (
    <section
      aria-label="מצב מסמכים"
      className="flex aspect-[5/3] w-full flex-col rounded-[32px] border border-[#FEF6F2]/10 bg-[#2B2B2B] p-2.5 shadow-[inset_0_1px_0_rgba(254,246,242,0.08)]"
    >
      <header className="mb-1.5 flex items-start justify-between gap-3">
        <div className="ps-3">
          <h2 className="text-[22px] font-semibold leading-6 text-[#FEF6F2]">
            מסמכים
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-[#FF5900]">
            {needing === 0
              ? "הכל בתוקף"
              : needing === 1
                ? "מסמך אחד דורש טיפול"
                : `${needing} דורשים טיפול`}
          </p>
        </div>
        <ProgressRing value={healthy} max={Math.max(activeCount, 1)} />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1">
        <MetricTile
          icon={OctagonX}
          label="פגי תוקף"
          value={attention.expired}
          lit={attention.expired > 0}
        />
        <MetricTile
          icon={ClockFading}
          label="לקראת פג תוקף"
          value={attention.expiring}
          lit={attention.expiring > 0}
        />
        <MetricTile
          icon={SquareDashedMousePointer}
          label="נדרש בדיקה"
          value={attention.needsReview}
          lit={attention.needsReview > 0}
        />
        <MetricTile
          icon={Users}
          label="כמות משתמשים"
          value={userCount}
          lit={false}
          accent="orange"
        />
      </div>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  lit,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  lit: boolean;
  accent?: "orange";
}) {
  const orange = accent === "orange";

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[22px] px-2 py-2 text-center",
        lit
          ? "bg-[#FEF6F2]/25 text-[#FEF6F2]"
          : orange
            ? "border border-[#FF5900]/45 bg-[#FF5900]/12 text-[#FF5900] shadow-[0_0_28px_rgba(255,89,0,0.4)]"
            : "border border-[#FEF6F2]/12 bg-[#FEF6F2]/[0.07] text-[#FEF6F2] shadow-[inset_0_1px_0_rgba(254,246,242,0.12)]",
      )}
    >
      <Icon
        className={cn(
          "size-[18px]",
          orange ? "text-[#FF5900]" : "text-[#FEF6F2]",
        )}
        strokeWidth={2}
        aria-hidden
      />
      <p
        className={cn(
          "text-[26px] font-semibold leading-none tabular-nums",
          orange && "drop-shadow-[0_0_14px_rgba(255,89,0,0.95)]",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "text-[12px] font-medium leading-4",
            lit
              ? "text-[#FEF6F2]"
              : orange
              ? "text-[#FF5900] drop-shadow-[0_0_8px_rgba(255,89,0,0.8)]"
              : "text-[#FEF6F2]/70",
        )}
      >
        {label}
      </p>
    </div>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const size = 44;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - progress);

  return (
    <div className="relative size-[44px] shrink-0" aria-hidden>
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
          className="drop-shadow-[0_0_6px_rgba(255,89,0,0.7)]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-[#FEF6F2]">
        {value}/{max}
      </span>
    </div>
  );
}
