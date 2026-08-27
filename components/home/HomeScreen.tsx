"use client";

import { DocumentPulse } from "./DocumentPulse";
import { ActivityFeed, FeedHeading } from "./ActivityFeed";
import {
  buildProcessingActivity,
  sortActivityItems,
} from "@/lib/activity";
import { getDocumentAttention } from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { ActivityActionKind } from "@/lib/types";

export function HomeScreen() {
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const activity = useAppStore((state) => state.activity);
  const jobs = useAppStore((state) => state.jobs);
  const openComposer = useAppStore((state) => state.openComposer);
  const openJobsSheet = useAppStore((state) => state.openJobsSheet);
  const attention = getDocumentAttention(documents);
  const processing = buildProcessingActivity(jobs);
  const items = sortActivityItems(
    processing ? [processing, ...activity] : activity,
    documents,
  );

  function handleAction(kind: ActivityActionKind) {
    if (kind === "openUpload") openComposer();
    if (kind === "openJobs") openJobsSheet();
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-4 lg:max-w-3xl lg:px-0 lg:py-8">
      <DocumentPulse attention={attention} />
      <section>
        <FeedHeading />
        <ActivityFeed
          items={items}
          employees={employees}
          documents={documents}
          jobs={jobs}
          onAction={handleAction}
        />
      </section>
    </div>
  );
}
