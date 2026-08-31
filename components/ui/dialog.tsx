"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useMounted } from "./use-mounted";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  header?: ReactNode;
  footer?: ReactNode;
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
  footer,
}: DialogProps) {
  const mounted = useMounted();
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-[#2B2B2B]/25 backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]",
          overlayClassName,
        )}
        aria-label="סגירה"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col rounded-[24px] bg-[#FFFDFB] shadow-[var(--shadow-card)]",
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
            header || footer
              ? "min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4"
              : "mt-4"
          }
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-stone-200/70 px-5 pb-5 pt-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
