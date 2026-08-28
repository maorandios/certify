"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  header?: ReactNode;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  titleHidden = false,
  children,
  className,
  overlayClassName,
  header,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        className={cn("absolute inset-0 bg-stone-900/40", overlayClassName)}
        aria-label="סגירה"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col rounded-[24px] bg-white shadow-[var(--shadow-card)]",
          header ? "overflow-hidden p-0" : "p-6",
          className,
        )}
      >
        {header}
        <h2
          id="dialog-title"
          className={
            titleHidden
              ? "sr-only"
              : header
                ? "px-5 pt-4 text-lg font-semibold"
                : "text-lg font-semibold"
          }
        >
          {title}
        </h2>
        <div
          className={
            header ? "min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4" : "mt-4"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
