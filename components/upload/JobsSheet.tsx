"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, uploadStageLabels } from "@/lib/copy";
import { selectActiveJobs, selectPendingJobs, useAppStore } from "@/lib/store";
import {
  ActivitySheetHeader,
  activityForJob,
  sheetDialogClassName,
  sheetDrawerClassName,
} from "@/components/home/ActivitySheetHeader";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";

export function JobsSheet() {
  const open = useAppStore((state) => state.ui.jobsSheetOpen);
  const closeJobsSheet = useAppStore((state) => state.closeJobsSheet);
  const jobs = useAppStore((state) => state.jobs);
  const focusedJobId = useAppStore((state) => state.ui.focusedJobId);
  const activityItems = useAppStore((state) => state.activity);
  const activeJobs = selectActiveJobs(jobs);
  const pendingJobs = selectPendingJobs(jobs);
  const isDesktop = useIsDesktop();
  const feedActivity = activityForJob(activityItems, focusedJobId);
  const cases = useAppStore((state) => state.cases);
  const extractedName =
    cases.find((entry) => entry.jobId === focusedJobId)?.extraction.fields
      .fullName ??
    (feedActivity?.jobId
      ? jobs.find((job) => job.id === feedActivity.jobId)?.extracted?.fullName
      : undefined);
  const header = feedActivity ? (
    <ActivitySheetHeader item={feedActivity} personName={extractedName} />
  ) : undefined;

  const body = (
    <ul className="space-y-3">
      {activeJobs.length === 0 && pendingJobs.length === 0 ? (
        <li className="text-sm text-stone-500">{copy.jobsEmpty}</li>
      ) : (
        <>
          {activeJobs.map((job) => (
            <li
              key={job.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl bg-stone-50 p-3",
                focusedJobId === job.id &&
                  "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[#FFFDFB]",
              )}
            >
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-[var(--color-brand)]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{job.fileMeta.name}</p>
                <p className="text-sm text-stone-500">
                  {uploadStageLabels[job.stage]}
                </p>
              </div>
            </li>
          ))}
          {pendingJobs.map((job) => (
            <li
              key={job.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl bg-[var(--color-brand-soft,#FFEDE0)]/60 p-3",
                focusedJobId === job.id &&
                  "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[#FFFDFB]",
              )}
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
              <div className="min-w-0">
                <p className="truncate font-medium">{job.fileMeta.name}</p>
                <p className="text-sm text-stone-500">
                  {uploadStageLabels[job.stage]} · ההחלטה מחכה בפיד
                </p>
              </div>
            </li>
          ))}
        </>
      )}
    </ul>
  );

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeJobsSheet();
        }}
        title={copy.jobsTitle}
        titleHidden={header != null}
        header={header}
        className={sheetDialogClassName}
      >
        {body}
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) closeJobsSheet();
      }}
      title={copy.jobsTitle}
      titleHidden={header != null}
      header={header}
      className={sheetDrawerClassName}
    >
      {body}
    </Drawer>
  );
}
