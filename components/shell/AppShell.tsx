"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useAppStore } from "@/lib/store";
import { BottomNav } from "./BottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { JobRunner } from "./JobRunner";
import { ProcessingCapsule } from "./ProcessingCapsule";
import { PageTransition } from "./PageTransition";
import { TopBar } from "./TopBar";
import { JobsSheet } from "@/components/upload/JobsSheet";
import { UploadComposer } from "@/components/upload/UploadComposer";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((state) => state.hydrate);
  const jobCount = useAppStore(
    (state) =>
      state.jobs.filter(
        (job) => job.stage !== "completed" && job.stage !== "failed",
      ).length,
  );

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) hydrate();
    };

    try {
      void Promise.resolve(useAppStore.persist.rehydrate()).then(
        finish,
        finish,
      );
    } catch {
      finish();
    }

    const timeout = window.setTimeout(finish, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [hydrate]);

  return (
    <div className="flex h-svh flex-col bg-[#FEF6F2]">
      <DesktopTopNav />
      <TopBar />
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <PageTransition>{children}</PageTransition>
      </main>
      {jobCount > 0 ? (
        <div className="flex shrink-0 justify-center px-4 pb-2 lg:hidden">
          <ProcessingCapsule placement="mobile" />
        </div>
      ) : null}
      <BottomNav />
      <UploadComposer />
      <JobsSheet />
      <JobRunner />
      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          className: "font-sans",
        }}
      />
    </div>
  );
}
