"use client";

import type { ReactNode } from "react";
import { Dialog } from "./dialog";
import { Drawer } from "./drawer";
import { useIsDesktop } from "./use-is-desktop";

type ResponsiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  children: ReactNode;
  /** Extra classes for the desktop dialog panel (e.g. max width). */
  dialogClassName?: string;
  /** Extra classes for the mobile drawer panel. */
  drawerClassName?: string;
  /** Extra classes for the mobile drawer’s scrollable body. */
  contentClassName?: string;
  /** Extra classes for the dimmed backdrop. */
  overlayClassName?: string;
  /** Sticky header between the handle and the scrollable body. */
  header?: ReactNode;
};

/** Bottom sheet on mobile, centered dialog on desktop. */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  titleHidden,
  children,
  dialogClassName,
  drawerClassName,
  contentClassName,
  overlayClassName,
  header,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        titleHidden={titleHidden}
        className={dialogClassName}
        overlayClassName={overlayClassName}
        header={header}
      >
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      titleHidden={titleHidden}
      className={drawerClassName}
      contentClassName={contentClassName}
      overlayClassName={overlayClassName}
      header={header}
    >
      {children}
    </Drawer>
  );
}
