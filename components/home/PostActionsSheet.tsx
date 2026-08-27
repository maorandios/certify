"use client";

import { CircleUserRound, FilePlus2, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { copy } from "@/lib/copy";
import type { ActivityActionKind, ActivityItem, Employee } from "@/lib/types";

type PostActionsSheetProps = {
  item: ActivityItem | null;
  employee?: Employee;
  onClose: () => void;
  onAction: (kind: ActivityActionKind) => void;
  onOpenEmployee: (employee: Employee) => void;
};

export function PostActionsSheet({
  item,
  employee,
  onClose,
  onAction,
  onOpenEmployee,
}: PostActionsSheetProps) {
  const postAction =
    item?.action && item.action.kind !== "openDecision" ? item.action : null;

  return (
    <Drawer
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={copy.postActionsTitle}
    >
      {item ? (
        <ul className="flex flex-col pb-2">
          {postAction?.kind === "openUpload" ? (
            <li>
              <ActionRow
                icon={FilePlus2}
                label={postAction.labelHe}
                onClick={() => {
                  onClose();
                  onAction("openUpload");
                }}
              />
            </li>
          ) : null}
          {postAction?.kind === "openJobs" ? (
            <li>
              <ActionRow
                icon={Loader2}
                label={postAction.labelHe}
                onClick={() => {
                  onClose();
                  onAction("openJobs");
                }}
              />
            </li>
          ) : null}
          {employee ? (
            <li>
              <ActionRow
                icon={CircleUserRound}
                label={copy.viewEmployee}
                onClick={() => {
                  onClose();
                  onOpenEmployee(employee);
                }}
              />
            </li>
          ) : null}
        </ul>
      ) : null}
    </Drawer>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FilePlus2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex min-h-11 w-full items-center gap-3 text-start text-[15px]"
      onClick={onClick}
    >
      <Icon className="size-4 shrink-0 text-stone-500" aria-hidden />
      {label}
    </button>
  );
}
