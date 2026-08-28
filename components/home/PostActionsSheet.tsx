"use client";

import { Drawer } from "@/components/ui/drawer";
import type { ActivityItem } from "@/lib/types";

type PostActionsSheetProps = {
  item: ActivityItem | null;
  onClose: () => void;
};

export function PostActionsSheet({ item, onClose }: PostActionsSheetProps) {
  return (
    <Drawer
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="פרטי פעילות"
      titleHidden
    >
      {item ? <div className="min-h-8" /> : null}
    </Drawer>
  );
}
