"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  children: ReactNode;
  className?: string;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  children,
  className,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="סגירה"
        className="absolute inset-0 bg-stone-900/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(28,25,23,0.18)] animate-[sheet-up_0.32s_cubic-bezier(0.32,0.72,0,1)]",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-stone-200" />
        <h2
          id="drawer-title"
          className={
            titleHidden ? "sr-only" : "px-5 pt-4 text-lg font-semibold"
          }
        >
          {title}
        </h2>
        <div className="max-h-[80svh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
