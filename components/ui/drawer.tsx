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

  if (!mounted) return null;

  return createPortal(
    <div className="relative z-[100]">
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="סגירה"
        className={cn(
          "fixed inset-0 bg-stone-900/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        aria-labelledby="drawer-title"
        className={cn(
          "fixed inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(28,25,23,0.18)] transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "pointer-events-none translate-y-full",
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
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
