"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { copy } from "@/lib/copy";
import { selectActiveJobs, useAppStore } from "@/lib/store";
import { cn } from "@/lib/cn";

type ProcessingCapsuleProps = {
  placement: "mobile" | "desktop";
};

export function ProcessingCapsule({ placement }: ProcessingCapsuleProps) {
  const jobs = useAppStore((state) => state.jobs);
  const openJobsSheet = useAppStore((state) => state.openJobsSheet);
  const activeJobs = selectActiveJobs(jobs);

  if (activeJobs.length === 0) return null;

  const label =
    activeJobs.length === 1
      ? copy.processingOne
      : copy.processingMany(activeJobs.length);

  return (
    <motion.button
      type="button"
      layout
      onClick={() => openJobsSheet()}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-full bg-stone-900 px-4 text-sm font-medium text-white shadow-lg",
        placement === "mobile" &&
          "pointer-events-auto max-w-[min(100%,20rem)]",
      )}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </motion.button>
  );
}
