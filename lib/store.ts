import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fileSizeLabel } from "./dates";
import { createSeed } from "./mock/seed";
import {
  applyHappyPathAssignment,
  buildHappyPathExtraction,
  nextStage,
  STAGE_DURATION_MS,
} from "./mock/uploadMachine";
import type { ActivityItem, DocumentRecord, Employee, UploadJob } from "./types";

type UiState = {
  composerOpen: boolean;
  jobsSheetOpen: boolean;
  hydrated: boolean;
};

type AppState = {
  employees: Employee[];
  documents: DocumentRecord[];
  activity: ActivityItem[];
  jobs: UploadJob[];
  ui: UiState;
  lastToast: string | null;
  hydrate: () => void;
  openComposer: () => void;
  closeComposer: () => void;
  openJobsSheet: () => void;
  closeJobsSheet: () => void;
  enqueueUpload: (file: { name: string; type: string; size: number }) => void;
  tickJobs: (now?: Date) => void;
  consumeToast: () => void;
};

const seed = createSeed();

function previewKind(mime: string): "image" | "pdf" {
  return mime.includes("pdf") ? "pdf" : "image";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      employees: seed.employees,
      documents: seed.documents,
      activity: seed.activity,
      jobs: [],
      lastToast: null,
      ui: {
        composerOpen: false,
        jobsSheetOpen: false,
        hydrated: false,
      },
      hydrate: () =>
        set((state) => ({
          ui: { ...state.ui, hydrated: true },
        })),
      openComposer: () =>
        set((state) => ({ ui: { ...state.ui, composerOpen: true } })),
      closeComposer: () =>
        set((state) => ({ ui: { ...state.ui, composerOpen: false } })),
      openJobsSheet: () =>
        set((state) => ({ ui: { ...state.ui, jobsSheetOpen: true } })),
      closeJobsSheet: () =>
        set((state) => ({ ui: { ...state.ui, jobsSheetOpen: false } })),
      consumeToast: () => set({ lastToast: null }),
      enqueueUpload: (file) => {
        const now = new Date();
        const job: UploadJob = {
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `job-${now.getTime()}`,
          stage: "reading",
          fileMeta: {
            name: file.name,
            mime: file.type || "application/octet-stream",
            sizeLabel: fileSizeLabel(file.size),
            previewKind: previewKind(file.type),
          },
          extracted: buildHappyPathExtraction(now),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        set((state) => ({
          jobs: [job, ...state.jobs],
          ui: { ...state.ui, composerOpen: false },
        }));
      },
      tickJobs: (now = new Date()) => {
        const { jobs, employees, documents, activity } = get();
        const active = jobs.filter(
          (job) => job.stage !== "completed" && job.stage !== "failed",
        );
        if (active.length === 0) return;

        let nextDocuments = documents;
        let nextActivity = activity;
        let toast: string | null = get().lastToast;
        const nextJobs = jobs.map((job) => {
          if (job.stage === "completed" || job.stage === "failed") return job;
          const elapsed = now.getTime() - new Date(job.updatedAt).getTime();
          if (elapsed < STAGE_DURATION_MS) return job;
          const upcoming = nextStage(job.stage);
          if (!upcoming) return job;
          if (upcoming === "completed") {
            const result = applyHappyPathAssignment({
              employees,
              documents: nextDocuments,
              job,
              now,
            });
            nextDocuments = result.documents;
            nextActivity = [...result.activity, ...nextActivity].slice(0, 40);
            toast = result.toastHe;
            return result.job;
          }
          return { ...job, stage: upcoming, updatedAt: now.toISOString() };
        });

        set({
          jobs: nextJobs.filter((job) => {
            if (job.stage !== "completed" && job.stage !== "failed") return true;
            const age = now.getTime() - new Date(job.updatedAt).getTime();
            return age < 2500;
          }),
          documents: nextDocuments,
          activity: nextActivity,
          lastToast: toast,
        });
      },
    }),
    {
      name: "certify-p0",
      version: 5,
      migrate: (persistedState) => {
        const previous = persistedState as { jobs?: UploadJob[] };
        const next = createSeed();
        return {
          employees: next.employees,
          documents: next.documents,
          activity: next.activity,
          jobs: previous.jobs ?? [],
        };
      },
      skipHydration: true,
      partialize: (state) => ({
        employees: state.employees,
        documents: state.documents,
        activity: state.activity,
        jobs: state.jobs,
      }),
    },
  ),
);

export function selectActiveJobs(jobs: UploadJob[]) {
  return jobs.filter(
    (job) => job.stage !== "completed" && job.stage !== "failed",
  );
}
