"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useMounted } from "./use-mounted";

const EASE = [0.32, 0.72, 0, 1] as const;
const SHEET_TRANSITION = { duration: 0.32, ease: EASE };

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  children: ReactNode;
  className?: string;
  /** Overrides the scrollable content area (e.g. full-height sheets). */
  contentClassName?: string;
  /** Extra classes for the dimmed backdrop behind the sheet. */
  overlayClassName?: string;
  /** Content between the drag handle and the scrollable body (e.g. a sticky header). */
  header?: ReactNode;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  children,
  className,
  contentClassName,
  overlayClassName,
  header,
}: DrawerProps) {
  const mounted = useMounted();

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
    <AnimatePresence>
      {open ? (
        <motion.button
          key="drawer-overlay"
          type="button"
          aria-label="סגירה"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SHEET_TRANSITION}
          className={cn(
            "fixed inset-0 z-[100] bg-stone-900/40",
            overlayClassName,
          )}
          onClick={() => onOpenChange(false)}
        />
      ) : null}
      {open ? (
        <motion.div
          key="drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={SHEET_TRANSITION}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[101] mx-auto flex w-full max-w-lg flex-col rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(28,25,23,0.18)]",
            className,
          )}
          style={{ willChange: "transform" }}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-stone-200" />
          <h2
            id="drawer-title"
            className={
              titleHidden ? "sr-only" : "px-5 pt-4 text-lg font-semibold"
            }
          >
            {title}
          </h2>
          {header}
          <div
            className={cn(
              "max-h-[80svh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3",
              contentClassName,
            )}
          >
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
