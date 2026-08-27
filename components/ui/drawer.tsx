"use client";

import type { ReactNode } from "react";
import { Drawer as VaulDrawer } from "vaul";
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
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange} noBodyStyles>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-stone-900/40 data-[state=closed]:pointer-events-none" />
        <VaulDrawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[24px] bg-white outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-stone-200" />
          <VaulDrawer.Title
            className={
              titleHidden ? "sr-only" : "px-5 pt-4 text-lg font-semibold"
            }
          >
            {title}
          </VaulDrawer.Title>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
            {children}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
