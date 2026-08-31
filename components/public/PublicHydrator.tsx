"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { bootPersistedStore, useAppStore } from "@/lib/store";

/**
 * Public routes (/r/[token], /u/[token]) render outside the app shell, so
 * they rehydrate the persisted mock store themselves before showing content.
 */
export function PublicHydrator({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((state) => state.hasHydrated);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => bootPersistedStore(), [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#FFFDFB]">
        <Loader2
          className="size-7 animate-spin text-[var(--color-brand,#FF5900)]"
          aria-label="טוען"
        />
      </div>
    );
  }

  return <>{children}</>;
}
