"use client";

import { useMemo, useState } from "react";
import { resolveActivityOpen } from "@/lib/activityOpen";
import { useAppStore } from "@/lib/store";
import type { ActivityItem, SourceFile } from "@/lib/types";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { ActivityCard } from "./ActivityCard";
import { AgenticActionSheet } from "./AgenticActionSheet";
import { CaseCard } from "./CaseCard";

type ActivityFeedProps = {
  items: ActivityItem[];
};

type ViewerTarget = {
  document?: { title?: string } | null;
  sourceFile?: SourceFile | null;
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  const jobs = useAppStore((state) => state.jobs);
  const cases = useAppStore((state) => state.cases);
  const sourceFiles = useAppStore((state) => state.sourceFiles);
  const requests = useAppStore((state) => state.requests);
  const workerSubmissions = useAppStore((state) => state.workerSubmissions);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerTarget>({});

  const openContext = useMemo(
    () => ({ requests, workerSubmissions, jobs, cases, sourceFiles }),
    [requests, workerSubmissions, jobs, cases, sourceFiles],
  );

  const activeItem = items.find((entry) => entry.id === activeId) ?? null;

  function openItem(item: ActivityItem) {
    const intent = resolveActivityOpen(item, openContext);
    if (intent.type === "agentic_sheet") setActiveId(item.id);
  }

  if (items.length === 0) {
    return <p className="py-6 text-sm text-stone-500">אין פעילות עדיין.</p>;
  }

  return (
    <>
      <ol className="m-0 list-none p-0">
        {items.map((item, index) => {
          const resolution = cases.find((entry) => entry.workerSubmissionId === item.workerSubmissionId);
          const isLast = index === items.length - 1;
          if (resolution) {
            return (
              <CaseCard
                key={item.id}
                item={item}
                isLast={isLast}
                onPostPress={openItem}
              />
            );
          }
          return (
            <ActivityCard
              key={item.id}
              item={item}
              isLast={isLast}
              onPostPress={openItem}
            />
          );
        })}
      </ol>
      <AgenticActionSheet
        item={activeItem}
        onClose={() => setActiveId(null)}
        onViewDocument={setViewer}
      />
      <DocumentViewer
        document={viewer.document ?? null}
        sourceFile={viewer.sourceFile ?? null}
        onClose={() => setViewer({})}
      />
    </>
  );
}
