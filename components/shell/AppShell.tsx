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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <DesktopTopNav />
      <TopBar />
      <main className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-x-hidden overflow-y-auto pb-[calc(6.75rem+env(safe-area-inset-bottom))] lg:px-6 lg:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>
      {jobCount > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 lg:hidden" style={{ bottom: "calc(5.6rem + env(safe-area-inset-bottom))" }}>
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
