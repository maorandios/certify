"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

export function JobRunner() {
  const tickJobs = useAppStore((state) => state.tickJobs);
  const lastToast = useAppStore((state) => state.lastToast);
  const consumeToast = useAppStore((state) => state.consumeToast);
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    const id = window.setInterval(() => tickJobs(), 250);
    return () => window.clearInterval(id);
  }, [tickJobs, hasHydrated]);

  useEffect(() => {
    if (!lastToast) return;
    toast.success(lastToast);
    if (
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      "vibrate" in navigator
    ) {
      navigator.vibrate(10);
    }
    consumeToast();
  }, [lastToast, consumeToast]);

  return null;
}
