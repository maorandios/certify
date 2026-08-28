"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, UserStar } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { LogoMark } from "./AppBrand";

export function BottomNav() {
  const pathname = usePathname();
  const openComposer = useAppStore((state) => state.openComposer);
  const feedActive = pathname === "/";
  const usersActive = pathname.startsWith("/employees");

  return (
    <nav
      aria-label="ניווט ראשי"
      className="shrink-0 border-t border-[var(--line)] bg-[#FEF6F2] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-3">
        <Link
          href="/"
          aria-current={feedActive ? "page" : undefined}
          className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#2B2B2B]"
        >
          <Flame
            className={cn("size-5", feedActive && "fill-current")}
            aria-hidden
          />
          <span>{copy.navFeed}</span>
        </Link>
        <button
          type="button"
          onClick={openComposer}
          className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#2B2B2B]"
        >
          <LogoMark />
          <span>{copy.navCreate}</span>
        </button>
        <Link
          href="/employees"
          aria-current={usersActive ? "page" : undefined}
          className="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#2B2B2B]"
        >
          <UserStar
            className={cn("size-5", usersActive && "fill-current")}
            aria-hidden
          />
          <span>{copy.navUsers}</span>
        </Link>
      </div>
    </nav>
  );
}
