"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { copy, uploadStageLabels } from "@/lib/copy";
import { selectActiveJobs, selectPendingJobs, useAppStore } from "@/lib/store";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";

export function JobsSheet() {
  const open = useAppStore((state) => state.ui.jobsSheetOpen);
  const closeJobsSheet = useAppStore((state) => state.closeJobsSheet);
  const jobs = useAppStore((state) => state.jobs);
  const activeJobs = selectActiveJobs(jobs);
  const pendingJobs = selectPendingJobs(jobs);
  const isDesktop = useIsDesktop();

  const body = (
    <ul className="space-y-3">
      {activeJobs.length === 0 && pendingJobs.length === 0 ? (
        <li className="text-sm text-stone-500">{copy.jobsEmpty}</li>
      ) : (
        <>
          {activeJobs.map((job) => (
            <li
              key={job.id}
              className="flex items-start gap-3 rounded-2xl bg-stone-50 p-3"
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
              className="flex items-start gap-3 rounded-2xl bg-[var(--color-brand-soft,#FFEDE0)]/60 p-3"
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
    >
      {body}
    </Drawer>
  );
}
