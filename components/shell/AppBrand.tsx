import { Zap } from "lucide-react";
import { copy } from "@/lib/copy";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full bg-[var(--logo-mark)] ${className}`}
      aria-hidden
    >
      <Zap
        className="size-[71%] text-[var(--logo-ink)]"
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  );
}

export function AppBrand() {
  return (
    <div className="flex items-center gap-2">
      <LogoMark />
      <span className="text-lg font-semibold text-[var(--logo-ink)]">
        {copy.appName}
      </span>
    </div>
  );
}
