"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { bootPersistedStore, selectActiveJobs, useAppStore } from "@/lib/store";
import { DemoSwitcher } from "@/components/dev/DemoSwitcher";
import { BottomNav } from "./BottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { DataSkeleton } from "./DataSkeleton";
import { JobRunner } from "./JobRunner";
import { ProcessingCapsule } from "./ProcessingCapsule";
import { PageTransition } from "./PageTransition";
import { TopBar } from "./TopBar";
import { JobsSheet } from "@/components/upload/JobsSheet";
import { UploadComposer } from "@/components/upload/UploadComposer";
import { RequestCreateSheet } from "@/components/requests/RequestCreateSheet";

export function AppShell({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((state) => state.hydrate);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const jobCount = useAppStore(
    (state) => (state.hasHydrated ? selectActiveJobs(state.jobs).length : 0),
  );

  useEffect(() => bootPersistedStore(), [hydrate]);

  return (
    <div className="flex h-svh flex-col bg-[#FFFDFB]">
      <DesktopTopNav />
      <div className="relative min-h-0 flex-1">
        <TopBar />
        <main className="h-full overflow-hidden">
          {hasHydrated ? (
            <PageTransition>{children}</PageTransition>
          ) : (
            <div className="h-full overflow-y-auto pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4.25rem+2rem+env(safe-area-inset-bottom))] lg:pt-0 lg:pb-0">
              <DataSkeleton />
            </div>
          )}
        </main>
        {jobCount > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 pb-2 lg:hidden">
            <div className="pointer-events-auto">
              <ProcessingCapsule placement="mobile" />
            </div>
          </div>
        ) : null}
        <BottomNav />
      </div>
      <RequestCreateSheet />
      <UploadComposer />
      <JobsSheet />
      <JobRunner />
      <DemoSwitcher />
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
