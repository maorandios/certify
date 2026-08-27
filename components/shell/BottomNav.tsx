"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FilePlus2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { unresolvedActivityCount } from "@/lib/activity";
import { useAppStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const openComposer = useAppStore((state) => state.openComposer);
  const unresolved = useAppStore((state) =>
    unresolvedActivityCount(state.activity),
  );
  const activityActive = pathname === "/";
  const employeesActive = pathname.startsWith("/employees");

  return (
    <nav
      aria-label="ניווט ראשי"
      className="shrink-0 border-t border-[var(--line)] bg-[#FEF6F2] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-3">
        <Link
          href="/"
          aria-current={activityActive ? "page" : undefined}
          className={cn(
            "relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            activityActive ? "text-[#FF5900]" : "text-stone-500",
          )}
        >
          <Activity className="size-5" aria-hidden />
          <span>{copy.appTitle}</span>
          {unresolved > 0 ? (
            <span className="absolute top-1.5 end-1/2 me-[-18px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF5900] px-1 text-[9px] font-semibold text-white">
              {unresolved}
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={openComposer}
          className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-[#FF5900]"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-[#FF5900] text-white">
            <FilePlus2 className="size-4" aria-hidden />
          </span>
          <span>{copy.upload}</span>
        </button>
        <Link
          href="/employees"
          aria-current={employeesActive ? "page" : undefined}
          className={cn(
            "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            employeesActive ? "text-[#FF5900]" : "text-stone-500",
          )}
        >
          <Users className="size-5" aria-hidden />
          <span>{copy.employeesTitle}</span>
        </Link>
      </div>
    </nav>
  );
}
