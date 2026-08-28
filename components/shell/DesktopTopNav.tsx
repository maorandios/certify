"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { AppBrand } from "./AppBrand";
import { SettingsEntry } from "./SettingsEntry";
import { ProcessingCapsule } from "./ProcessingCapsule";

export function DesktopTopNav() {
  const pathname = usePathname();
  const openComposer = useAppStore((state) => state.openComposer);

  return (
    <header className="hidden shrink-0 bg-[#FEF6F2] lg:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-6">
        <AppBrand />
        <nav aria-label="ניווט ראשי" className="flex items-center gap-1">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-full px-3 text-sm font-medium",
              pathname === "/"
                ? "bg-stone-100 text-[var(--ink)]"
                : "text-stone-500 hover:bg-stone-50",
            )}
          >
            {copy.appTitle}
          </Link>
          <button
            type="button"
            onClick={() => openComposer()}
            className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          >
            <FilePlus2 className="size-4" aria-hidden />
            {copy.upload}
          </button>
          <Link
            href="/employees"
            aria-current={pathname.startsWith("/employees") ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-full px-3 text-sm font-medium",
              pathname.startsWith("/employees")
                ? "bg-stone-100 text-[var(--ink)]"
                : "text-stone-500 hover:bg-stone-50",
            )}
          >
            {copy.employeesTitle}
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <ProcessingCapsule placement="desktop" />
          <SettingsEntry />
        </div>
      </div>
    </header>
  );
}
