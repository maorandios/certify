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
  /** Sticky actions below the scrollable body. */
  footer?: ReactNode;
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
  footer,
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
            "fixed inset-0 z-[100] bg-[#2B2B2B]/25 backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]",
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
            "fixed inset-x-0 bottom-0 z-[101] mx-auto flex w-full max-w-lg flex-col rounded-t-[24px] bg-[#FFFDFB] shadow-[0_-8px_32px_rgba(28,25,23,0.18)]",
            className,
          )}
          style={{ willChange: "transform" }}
        >
          <div className="mx-auto mt-1.5 h-1.5 w-12 shrink-0 rounded-full bg-stone-200" />
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
              "max-h-[80svh] min-h-0 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3",
              footer && "pb-3",
              contentClassName,
            )}
          >
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-stone-200/70 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              {footer}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
