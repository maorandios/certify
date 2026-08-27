"use client";

import { Loader2 } from "lucide-react";
import { copy, uploadStageLabels } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";

export function JobsSheet() {
  const open = useAppStore((state) => state.ui.jobsSheetOpen);
  const closeJobsSheet = useAppStore((state) => state.closeJobsSheet);
  const jobs = useAppStore((state) => state.jobs);
  const activeJobs = jobs.filter(
    (job) => job.stage !== "completed" && job.stage !== "failed",
  );
  const isDesktop = useIsDesktop();

  const body = (
    <ul className="space-y-3">
      {activeJobs.length === 0 ? (
        <li className="text-sm text-stone-500">{copy.jobsEmpty}</li>
      ) : (
        activeJobs.map((job) => (
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
        ))
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
