"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

/**
 * Public routes (/s/[token], /r/[token]) render outside the app shell, so
 * they rehydrate the persisted mock store themselves before showing content.
 */
export function PublicHydrator({ children }: { children: ReactNode }) {
  const hydrated = useAppStore((state) => state.ui.hydrated);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) hydrate();
    };
    try {
      void Promise.resolve(useAppStore.persist.rehydrate()).then(
        finish,
        finish,
      );
    } catch {
      finish();
    }
    const timeout = window.setTimeout(finish, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#FEF6F2]">
        <Loader2
          className="size-7 animate-spin text-[var(--color-brand,#FF5900)]"
          aria-label="טוען"
        />
      </div>
    );
  }

  return <>{children}</>;
}
