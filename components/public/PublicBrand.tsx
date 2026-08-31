import { Zap } from "lucide-react";
import { copy } from "@/lib/copy";

export function PublicBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span
        className="flex size-[38px] items-center justify-center rounded-full bg-[var(--logo-mark,#FF5900)]"
        aria-hidden
      >
        <Zap
          className="size-[60%] text-[var(--logo-ink,#2B2B2B)]"
          fill="currentColor"
          strokeWidth={0}
        />
      </span>
      <div>
        <p className="text-lg font-semibold text-[#2B2B2B]">{copy.appName}</p>
        {subtitle ? (
          <p className="mt-0.5 text-[12.5px] font-medium text-stone-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
