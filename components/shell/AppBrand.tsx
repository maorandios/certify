import { Zap } from "lucide-react";
import { copy } from "@/lib/copy";

export function AppBrand() {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-7 items-center justify-center rounded-full bg-[var(--logo-mark)]"
        aria-hidden
      >
        <Zap
          className="size-5 text-[var(--logo-ink)]"
          fill="currentColor"
          strokeWidth={0}
        />
      </span>
      <span className="text-lg font-semibold text-[var(--logo-ink)]">
        {copy.appName}
      </span>
    </div>
  );
}
