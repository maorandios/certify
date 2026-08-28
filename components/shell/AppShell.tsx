"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { selectActiveJobs, useAppStore } from "@/lib/store";
import { DemoSwitcher } from "@/components/dev/DemoSwitcher";
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
    (state) => selectActiveJobs(state.jobs).length,
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
    <div className="flex h-svh flex-col bg-[#FFFDFB]">
      <DesktopTopNav />
      <div className="relative min-h-0 flex-1">
        <TopBar />
        <main className="h-full overflow-hidden">
          <PageTransition>{children}</PageTransition>
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
