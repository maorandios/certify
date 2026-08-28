"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, UserStar } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { LogoMark } from "./AppBrand";

const itemClass =
  "relative flex h-full flex-col items-center justify-end gap-0.5 overflow-visible pb-2 text-[12.1px] font-medium text-[#2B2B2B]";

export function BottomNav() {
  const pathname = usePathname();
  const openComposer = useAppStore((state) => state.openComposer);
  const feedActive = pathname === "/";
  const usersActive = pathname.startsWith("/employees");

  return (
    <nav
      aria-label="ניווט ראשי"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 overflow-visible lg:hidden"
    >
      <div className="pointer-events-auto overflow-visible border-t border-[#2B2B2B]/5 bg-[#FEF6F2]/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]">
        <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-3 overflow-visible">
        <Link
          href="/"
          aria-current={feedActive ? "page" : undefined}
          className={itemClass}
        >
          <Flame
            className={cn("size-[22px]", feedActive && "fill-current")}
            aria-hidden
          />
          <span>{copy.navFeed}</span>
        </Link>
        <button type="button" onClick={openComposer} className={itemClass}>
          <LogoMark className="absolute top-0 left-1/2 size-[47px] -translate-x-1/2 -translate-y-1/2 shadow-[0_6px_20px_rgba(255,89,0,0.4)]" />
          <span className="size-[22px]" aria-hidden />
          <span>{copy.navCreate}</span>
        </button>
        <Link
          href="/employees"
          aria-current={usersActive ? "page" : undefined}
          className={itemClass}
        >
          <UserStar
            className={cn("size-[22px]", usersActive && "fill-current")}
            aria-hidden
          />
          <span>{copy.navUsers}</span>
        </Link>
      </div>
      </div>
    </nav>
  );
}
