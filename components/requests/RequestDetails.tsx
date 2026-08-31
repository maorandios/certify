"use client";

import { useMemo, useState } from "react";
import { copy } from "@/lib/copy";
import { formatHeDate } from "@/lib/dates";
import {
  requestListBadge,
  requestWorkerCounts,
  isSubmittedWorker,
  workerStatusLabels,
} from "@/lib/requests/status";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ActivityItem } from "@/lib/types";
import { AgenticActionSheet } from "@/components/home/AgenticActionSheet";

type RequestDetailsProps = {
  requestId: string;
};

export function RequestDetails({ requestId }: RequestDetailsProps) {
  const requests = useAppStore((state) => state.requests);
  const workerSubmissions = useAppStore((state) => state.workerSubmissions);
  const documents = useAppStore((state) => state.documentSubmissions);
  const cases = useAppStore((state) => state.cases);
  const activity = useAppStore((state) => state.activity);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const request = requests.find((entry) => entry.id === requestId);
  const workers = workerSubmissions.filter((entry) => entry.requestId === requestId);
  const now = useMemo(() => new Date(seedAnchor || request?.createdAt || 0), [seedAnchor, request?.createdAt]);
  const [sheetItem, setSheetItem] = useState<ActivityItem | null>(null);

  if (!request) {
    return <p className="px-4 py-10 text-center text-sm text-stone-500">{copy.requestNotFound}</p>;
  }

  const counts = requestWorkerCounts(request.id, workers, documents, cases);
  const submitted = workers.filter(isSubmittedWorker);

  return (
    <div className="grid gap-4">
      <header className="flex flex-col items-center gap-3 rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        <h2 className="text-xl font-semibold">{request.title}</h2>
        <StatusBadge status={requestListBadge(request, now)} />
        <p className="text-[13.5px] text-stone-500">
          {copy.recipientLabel}: {request.recipient.name}
        </p>
        <p className="text-[13px] text-stone-500">
          {copy.expiresAtLabel}: {formatHeDate(request.expiresAt.slice(0, 10))}
        </p>
        <p className="text-[13px] font-medium text-stone-600">
          {copy.workersSubmitted(counts.submitted)} · {copy.workersComplete(counts.complete)} ·{" "}
          {copy.workersNeedsReview(counts.needsReview)}
        </p>
      </header>

      <section className="grid gap-2">
        <h3 className="px-1 text-[13px] font-semibold text-stone-500">{copy.sectionSlots}</h3>
        <ul className="grid gap-2">
          {request.requestedDocuments.map((slot) => (
            <li
              key={slot.id}
              className="rounded-[20px] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
            >
              <p className="text-[15px] font-medium">{slot.label}</p>
              {slot.instructions ? (
                <p className="text-[12.5px] text-stone-500">{slot.instructions}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2">
        <h3 className="px-1 text-[13px] font-semibold text-stone-500">{copy.sectionWorkers}</h3>
        {submitted.length === 0 ? (
          <p className="rounded-[20px] bg-white px-4 py-6 text-center text-[13.5px] text-stone-500 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            {copy.noWorkersYet}
          </p>
        ) : (
          <ul className="grid gap-2">
            {submitted.map((worker) => {
              const item =
                activity.find((entry) => entry.id === worker.activityId) ??
                ({
                  id: worker.activityId ?? worker.id,
                  type: "action",
                  titleHe: worker.submittedFullName,
                  timestamp: worker.submittedAt ?? request.createdAt,
                  openBehavior: "agentic_sheet",
                  requestId: request.id,
                  workerSubmissionId: worker.id,
                } satisfies ActivityItem);
              return (
                <li key={worker.id}>
                  <Button
                    variant="secondary"
                    className="h-auto min-h-[72px] w-full justify-start rounded-[20px] px-4 py-3 text-start"
                    onClick={() => setSheetItem(item)}
                  >
                    <span>
                      <span className="block text-[15px] font-semibold">{worker.submittedFullName}</span>
                      <span className="block text-[12.5px] text-stone-500">
                        {workerStatusLabels[worker.status]}
                      </span>
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AgenticActionSheet
        item={sheetItem}
        onClose={() => setSheetItem(null)}
        onViewDocument={() => undefined}
      />
    </div>
  );
}
