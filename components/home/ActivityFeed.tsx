"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveActivityOpen } from "@/lib/activityOpen";
import { useAppStore } from "@/lib/store";
import type {
  ActivityItem,
  DocumentRecord,
  Employee,
} from "@/lib/types";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { EmployeeFormSheet } from "@/components/employees/EmployeeFormSheet";
import { ActivityCard } from "./ActivityCard";
import { ActivityResultList } from "./ActivityResultList";
import { DecisionActionSheet } from "./DecisionActionSheet";

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
  const router = useRouter();
  const jobs = useAppStore((state) => state.jobs);
  const openComposer = useAppStore((state) => state.openComposer);
  const openJobsSheet = useAppStore((state) => state.openJobsSheet);

  const [decisionItem, setDecisionItem] = useState<ActivityItem | null>(null);
  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);
  const [resultItem, setResultItem] = useState<ActivityItem | null>(null);
  const [createItem, setCreateItem] = useState<ActivityItem | null>(null);

  const openContext = useMemo(
    () => ({ employees, documents, jobs }),
    [employees, documents, jobs],
  );

  function openItem(item: ActivityItem) {
    const intent = resolveActivityOpen(item, openContext);
    switch (intent.type) {
      case "action_sheet":
        setDecisionItem(item);
        return;
      case "document_viewer": {
        const document = documents.find(
          (entry) => entry.id === intent.documentId,
        );
        if (document) setViewerDoc(document);
        return;
      }
      case "employee_details":
        router.push(`/employees/${intent.employeeId}`);
        return;
      case "jobs_sheet":
        openJobsSheet(intent.jobId);
        return;
      case "result_list":
        setResultItem(item);
        return;
      case "create_employee":
        setCreateItem(item);
        return;
      case "replace_file":
        openComposer({
          resolvesActivityId: item.id,
          target: item.employeeId
            ? { employeeId: item.employeeId }
            : undefined,
        });
        return;
      case "none":
        return;
    }
  }

  const createJob = jobs.find((job) => job.id === createItem?.jobId);
  const createPrefill = createJob?.extracted
    ? {
        fullName: createJob.extracted.fullName,
        identityNumber: createJob.extracted.identityNumber.replace(/\D/g, ""),
      }
    : undefined;

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
            openContext={openContext}
            isLast={index === items.length - 1}
            onPostPress={openItem}
          />
        ))}
      </ol>
      <DecisionActionSheet
        item={decisionItem}
        onClose={() => setDecisionItem(null)}
      />
      <ActivityResultList
        item={resultItem}
        onClose={() => setResultItem(null)}
        onSelect={setViewerDoc}
      />
      <DocumentViewer
        document={viewerDoc}
        onClose={() => setViewerDoc(null)}
      />
      <EmployeeFormSheet
        open={createItem != null}
        onClose={() => setCreateItem(null)}
        mode="create"
        prefill={createPrefill}
        activityId={createItem?.id}
        activity={createItem ?? undefined}
        onSaved={() => setCreateItem(null)}
      />
    </>
  );
}
