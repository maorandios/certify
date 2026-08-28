"use client";

import { DocumentPulse } from "./DocumentPulse";
import { ActivityFeed } from "./ActivityFeed";
import {
  buildProcessingActivity,
  sortActivityItems,
} from "@/lib/activity";
import { getDocumentAttention, isActiveDocument } from "@/lib/status";
import { useAppStore } from "@/lib/store";

export function HomeScreen() {
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const activity = useAppStore((state) => state.activity);
  const jobs = useAppStore((state) => state.jobs);
  const statusNow = new Date(seedAnchor);
  const attention = getDocumentAttention(documents, statusNow);
  const processing = buildProcessingActivity(jobs);
  const items = sortActivityItems(
    processing ? [processing, ...activity] : activity,
    documents,
    statusNow,
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-3 lg:max-w-3xl lg:px-0 lg:py-8">
      <DocumentPulse
        attention={attention}
        activeCount={documents.filter(isActiveDocument).length}
      />
      <section>
        <ActivityFeed
          items={items}
          employees={employees}
          documents={documents}
        />
      </section>
    </div>
  );
}
