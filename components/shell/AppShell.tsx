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
  const hydrated = useAppStore((state) => state.ui.hydrated);
  const hydrate = useAppStore((state) => state.hydrate);
  const jobCount = useAppStore(
    (state) =>
      state.jobs.filter(
        (job) => job.stage !== "completed" && job.stage !== "failed",
      ).length,
  );

  useEffect(() => {
    void Promise.resolve(useAppStore.persist.rehydrate()).finally(() =>
      hydrate(),
    );
  }, [hydrate]);

  return (
    <div className="flex min-h-dvh flex-col">
      <DesktopTopNav />
      <TopBar />
      <main className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden pb-[calc(6.75rem+env(safe-area-inset-bottom))] lg:px-6 lg:pb-8">
        {hydrated ? (
          <PageTransition>{children}</PageTransition>
        ) : (
          <HomeSkeleton />
        )}
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

function HomeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-4">
      <div className="h-20 animate-pulse rounded-2xl bg-stone-200/80" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-2xl bg-stone-200/80"
        />
      ))}
    </div>
  );
}
