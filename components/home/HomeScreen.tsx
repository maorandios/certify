"use client";

import { DocumentPulse } from "./DocumentPulse";
import { ActivityFeed } from "./ActivityFeed";
import {
  buildProcessingActivity,
  sortActivityItems,
  visibleActivityItems,
} from "@/lib/activity";
import { getSubmissionPulse } from "@/lib/requests/status";
import { useAppStore } from "@/lib/store";

export function HomeScreen() {
  const activity = useAppStore((state) => state.activity);
  const jobs = useAppStore((state) => state.jobs);
  const cases = useAppStore((state) => state.cases);
  const workers = useAppStore((state) => state.workerSubmissions);
  const documents = useAppStore((state) => state.documentSubmissions);
  const demoForce = useAppStore((state) => state.demoForce);
  const pulse = getSubmissionPulse(workers, documents, cases);
  const processing = buildProcessingActivity(jobs);
  const visible = visibleActivityItems(activity);
  const items =
    demoForce === "empty"
      ? []
      : sortActivityItems(processing ? [processing, ...visible] : visible);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-3 lg:max-w-3xl lg:px-0 lg:py-8">
      <DocumentPulse
        attention={{
          needsReview: pulse.needsReview,
          waiting: pulse.waiting,
          complete: pulse.complete,
        }}
        activeCount={Math.max(pulse.submitted, 1)}
      />
      <section>
        <ActivityFeed items={items} />
      </section>
    </div>
  );
}
