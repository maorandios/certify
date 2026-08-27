"use client";

import { Drawer } from "@/components/ui/drawer";
import { EmployeeIdentityCard } from "./EmployeeIdentityCard";
import { copy } from "@/lib/copy";
import type { Employee } from "@/lib/types";

type EmployeePreviewSheetProps = {
  employee: Employee | null;
  onClose: () => void;
};

export function EmployeePreviewSheet({
  employee,
  onClose,
}: EmployeePreviewSheetProps) {
  return (
    <Drawer
      open={Boolean(employee)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={employee?.fullName ?? copy.employeeCardTitle}
      titleHidden
    >
      {employee ? (
        <EmployeeIdentityCard
          employee={employee}
          showOpenPage
          onOpenPage={onClose}
        />
      ) : null}
    </Drawer>
  );
}
