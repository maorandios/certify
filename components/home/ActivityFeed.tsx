"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import type {
  ActivityActionKind,
  ActivityItem,
  DocumentRecord,
  Employee,
  UploadJob,
} from "@/lib/types";
import { processingProgress } from "@/lib/activity";
import { ActivityCard } from "./ActivityCard";
import { EmployeePreviewSheet } from "./EmployeePreviewSheet";
import { PostActionsSheet } from "./PostActionsSheet";

type ActivityFeedProps = {
  items: ActivityItem[];
  employees: Employee[];
  documents: DocumentRecord[];
  jobs: UploadJob[];
  onAction: (kind: ActivityActionKind) => void;
};

export function ActivityFeed({
  items,
  employees,
  documents,
  jobs,
  onAction,
}: ActivityFeedProps) {
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);
  const [actionItem, setActionItem] = useState<ActivityItem | null>(null);
  const actionEmployee = employees.find(
    (entry) => entry.id === actionItem?.employeeId,
  );

  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-stone-500">אין פעילות עדיין.</p>
    );
  }

  return (
    <>
      <ol className="m-0 list-none p-0">
        {items.map((item, index) => (
          <ActivityCard
            key={item.id}
            item={item}
            employees={employees}
            documents={documents}
            isLast={index === items.length - 1}
            progress={
              item.type === "processing" ? processingProgress(jobs) : 0
            }
            onAction={onAction}
            onEmployeePress={setPreviewEmployee}
            onPostActionsPress={setActionItem}
          />
        ))}
      </ol>
      <EmployeePreviewSheet
        employee={previewEmployee}
        onClose={() => setPreviewEmployee(null)}
      />
      <PostActionsSheet
        item={actionItem}
        employee={actionEmployee}
        onClose={() => setActionItem(null)}
        onAction={onAction}
        onOpenEmployee={setPreviewEmployee}
      />
    </>
  );
}

export function FeedHeading() {
  return (
    <h2 className="mb-2.5 text-sm font-medium text-stone-500">{copy.feedTitle}</h2>
  );
}
