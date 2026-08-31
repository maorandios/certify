"use client";

import type { ActivityItem } from "@/lib/types";
import { ActivityCard } from "./ActivityCard";

type CaseCardProps = {
  item: ActivityItem;
  isLast?: boolean;
  onPostPress: (item: ActivityItem) => void;
};

export function CaseCard({
  item,
  isLast = false,
  onPostPress,
}: CaseCardProps) {
  return (
    <ActivityCard
      item={item}
      isLast={isLast}
      onPostPress={onPostPress}
    />
  );
}
