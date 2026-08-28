"use client";

import { useState } from "react";
import type {
  ActivityItem,
  DocumentRecord,
  Employee,
} from "@/lib/types";
import { ActivityCard } from "./ActivityCard";
import { ActivityActionSheet } from "./ActivityActionSheet";

type ActivityFeedProps = {
  items: ActivityItem[];
  employees: Employee[];
  documents: DocumentRecord[];
};

export function ActivityFeed({
  items,
  employees,
  documents,
}: ActivityFeedProps) {
  const [actionItem, setActionItem] = useState<ActivityItem | null>(null);

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
            onPostPress={setActionItem}
          />
        ))}
      </ol>
      <ActivityActionSheet
        item={actionItem}
        onClose={() => setActionItem(null)}
      />
    </>
  );
}
