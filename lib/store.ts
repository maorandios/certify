import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, fileSizeLabel } from "./dates";
import { copy } from "./copy";
import { newId } from "./ids";
import { makeToken, publicRequestUrl, publicReuploadUrl } from "./links";
import { createRequestSeed } from "./mock/requestSeed";
import { createRequestQaDataset } from "./mock/requestQaDataset";
import { extractionForUploadScenario } from "./mock/requestExtractions";
import { nextStage, STAGE_DURATION_MS } from "./mock/uploadMachine";
import { buildRequestMessageHe, buildReuploadMessageHe } from "./requests/message";
import { isSubmittedWorker } from "./requests/status";
import {
  applyRequestExpiry,
  canReopenRequest,
  extendRequestExpiry,
  isReuploadLinkOpen,
  reopenRequest,
} from "./requests/transitions";
import type {
  DocumentRequest,
  RequestDocumentSubmission,
  RequestReuploadLink,
  RequestWorkerSubmission,
} from "./requests/types";
import {
  applyAnswer,
  applyExtraction,
  createInvestigatingCase,
  createWorkerCase,
  evaluateWorker,
  type ResolutionWorld,
} from "./resolution/engine";
import { projectRequestActivity } from "./resolution/projection";
import type { ResolutionAnswer, ResolutionCase } from "./resolution/types";
import type {
  ActivityItem,
  DemoScenarioId,
  SlotUploadContext,
  SourceFile,
  UploadJob,
} from "./types";

export type ComposerContext = {
  slot?: SlotUploadContext;
} | null;

export type DemoForcedState = "empty" | "loading" | "error" | null;

type UiState = {
  composerOpen: boolean;
  composerContext: ComposerContext;
  requestCreateOpen: boolean;
  jobsSheetOpen: boolean;
  focusedJobId: string | null;
  hydrated: boolean;
};

type AppState = {
  seedAnchor: string;
  requests: DocumentRequest[];
  workerSubmissions: RequestWorkerSubmission[];
  documentSubmissions: RequestDocumentSubmission[];
  reuploadLinks: RequestReuploadLink[];
  activity: ActivityItem[];
  jobs: UploadJob[];
  cases: ResolutionCase[];
  sourceFiles: SourceFile[];
  undoLog: ResolutionWorld["undoLog"];
  nextOutcome: DemoScenarioId;
  jobsPaused: boolean;
  demoForce: DemoForcedState;
  ui: UiState;
  lastToast: string | null;
  hasHydrated: boolean;
  qaDatasetActive: boolean;

  hydrate: () => void;
  openComposer: (context?: ComposerContext) => void;
  closeComposer: () => void;
  openRequestCreate: () => void;
  closeRequestCreate: () => void;
  openJobsSheet: (jobId?: string) => void;
  closeJobsSheet: () => void;
  consumeToast: () => void;

  createDocumentRequest: (input: {
    title: string;
    recipientName: string;
    phone?: string;
    email?: string;
    documents: Array<{ label: string; instructions?: string }>;
    expiresAt: string;
  }) => DocumentRequest | { error: string };
  markRequestOpened: (token: string) => void;
  closeRequest: (requestId: string) => void;
  reopenRequest: (requestId: string) => void;
  revokeRequest: (requestId: string) => void;
  extendRequestExpiry: (requestId: string, expiresAt: string) => void;
  updateRequestMessage: (requestId: string, messageHe: string) => void;

  startWorkerDraft: (input: {
    requestId: string;
    submittedFullName: string;
    submittedIdentityNumber?: string;
  }) => RequestWorkerSubmission;
  attachSlotFile: (input: {
    workerSubmissionId: string;
    requestedDocumentId: string;
    file: { name: string; type: string; size: number };
    processNow?: boolean;
  }) => void;
  submitWorker: (workerSubmissionId: string) => void;
  uploadFileForSlot: (input: {
    workerSubmissionId: string;
    requestedDocumentId: string;
    file: { name: string; type: string; size: number };
  }) => void;
  enqueueUpload: (
    file: { name: string; type: string; size: number },
    options?: { slot?: SlotUploadContext },
  ) => void;
  tickJobs: (now?: Date) => void;

  answerCase: (caseId: string, answer: ResolutionAnswer) => void;
  approveWorker: (workerSubmissionId: string) => void;
  createReuploadLink: (input: {
    workerSubmissionId: string;
    requestedDocumentId: string;
  }) => RequestReuploadLink | null;
  submitReupload: (
    token: string,
    file: { name: string; type: string; size: number },
  ) => void;

  setNextOutcome: (outcome: DemoScenarioId) => void;
  setJobsPaused: (paused: boolean) => void;
  completeActiveJobs: () => void;
  setDemoForce: (state: DemoForcedState) => void;
  resetMockData: () => void;
  loadEdgeCaseQaDataset: () => void;
  resetEdgeCaseQaDataset: () => void;
  restoreRegularDemoSeed: () => void;
};

function previewKind(mime: string): "image" | "pdf" {
  return mime.includes("pdf") ? "pdf" : "image";
}

function worldFrom(state: {
  requests: DocumentRequest[];
  workerSubmissions: RequestWorkerSubmission[];
  documentSubmissions: RequestDocumentSubmission[];
  reuploadLinks: RequestReuploadLink[];
  cases: ResolutionCase[];
  sourceFiles: SourceFile[];
  activity: ActivityItem[];
  jobs: UploadJob[];
  undoLog: ResolutionWorld["undoLog"];
}): ResolutionWorld {
  return {
    requests: state.requests,
    workerSubmissions: state.workerSubmissions,
    documentSubmissions: state.documentSubmissions,
    reuploadLinks: state.reuploadLinks,
    cases: state.cases,
    sourceFiles: state.sourceFiles,
    activity: state.activity,
    jobs: state.jobs,
    undoLog: state.undoLog,
  };
}

function applyWorld(world: ResolutionWorld) {
  return {
    requests: world.requests,
    workerSubmissions: world.workerSubmissions,
    documentSubmissions: world.documentSubmissions,
    reuploadLinks: world.reuploadLinks,
    cases: world.cases,
    sourceFiles: world.sourceFiles,
    activity: world.activity,
    jobs: world.jobs,
    undoLog: world.undoLog,
  };
}

export const APP_STORE_VERSION = 14;

export function bootPersistedStore(): () => void {
  const finish = () => {
    if (!useAppStore.getState().hasHydrated) {
      useAppStore.getState().hydrate();
    }
  };
  const persistApi = useAppStore.persist;
  if (!persistApi) {
    finish();
    return () => undefined;
  }
  const unsub = persistApi.onFinishHydration(finish);
  try {
    void Promise.resolve(persistApi.rehydrate()).then(finish, finish);
  } catch {
    finish();
  }
  return unsub;
}

function applyExpiryToRequests(requests: DocumentRequest[], now: Date) {
  return requests.map((request) => applyRequestExpiry(request, now));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      seedAnchor: "",
      requests: [],
      workerSubmissions: [],
      documentSubmissions: [],
      reuploadLinks: [],
      activity: [],
      jobs: [],
      cases: [],
      sourceFiles: [],
      undoLog: [],
      nextOutcome: "certain_match",
      jobsPaused: false,
      demoForce: null,
      ui: {
        composerOpen: false,
        composerContext: null,
        requestCreateOpen: false,
        jobsSheetOpen: false,
        focusedJobId: null,
        hydrated: false,
      },
      lastToast: null,
      hasHydrated: false,
      qaDatasetActive: false,

      hydrate: () => {
        const current = get();
        if (current.hasHydrated) return;
        if (
          current.seedAnchor &&
          Array.isArray(current.requests) &&
          Array.isArray(current.workerSubmissions) &&
          Array.isArray(current.documentSubmissions)
        ) {
          set({
            hasHydrated: true,
            requests: applyExpiryToRequests(current.requests, new Date(current.seedAnchor)),
          });
          return;
        }
        const seed = createRequestSeed(new Date());
        set({
          ...applyWorld(seed),
          seedAnchor: seed.seedAnchor,
          hasHydrated: true,
        });
      },

      openComposer: (context) =>
        set((state) => ({
          ui: { ...state.ui, composerOpen: true, composerContext: context ?? null },
        })),
      closeComposer: () =>
        set((state) => ({
          ui: { ...state.ui, composerOpen: false, composerContext: null },
        })),
      openRequestCreate: () =>
        set((state) => ({ ui: { ...state.ui, requestCreateOpen: true } })),
      closeRequestCreate: () =>
        set((state) => ({ ui: { ...state.ui, requestCreateOpen: false } })),
      openJobsSheet: (jobId) =>
        set((state) => ({
          ui: { ...state.ui, jobsSheetOpen: true, focusedJobId: jobId ?? null },
        })),
      closeJobsSheet: () =>
        set((state) => ({
          ui: { ...state.ui, jobsSheetOpen: false, focusedJobId: null },
        })),
      consumeToast: () => set({ lastToast: null }),

      createDocumentRequest: (input) => {
        const title = input.title.trim();
        const recipientName = input.recipientName.trim();
        const labeledDocuments = input.documents
          .map((doc) => ({
            label: doc.label.trim(),
            instructions: doc.instructions?.trim() || undefined,
          }))
          .filter((doc) => doc.label);
        if (!title || !recipientName) return { error: "missing_fields" };
        if (!input.phone?.trim() && !input.email?.trim()) return { error: "missing_contact" };
        if (labeledDocuments.length === 0) return { error: "missing_slots" };
        const now = new Date();
        const parsedExpiry = input.expiresAt ? new Date(input.expiresAt) : undefined;
        if (parsedExpiry && Number.isNaN(parsedExpiry.getTime())) return { error: "invalid_expiry" };
        if (parsedExpiry && parsedExpiry.getTime() <= now.getTime()) return { error: "invalid_expiry" };
        const expiresAt = parsedExpiry?.toISOString() ?? addDays(now, 14).toISOString();
        const id = newId("req");
        const token = makeToken("r");
        const requestedDocuments = labeledDocuments.map((doc, index) => ({
          id: `slot-${id}-${index + 1}`,
          requestId: id,
          label: doc.label,
          instructions: doc.instructions,
          sortOrder: index,
        }));
        const created: DocumentRequest = {
          id,
          title,
          recipient: {
            name: recipientName,
            phone: input.phone?.trim() || undefined,
            email: input.email?.trim() || undefined,
          },
          requestedDocuments,
          expiresAt,
          status: "active",
          token,
          createdAt: now.toISOString(),
          messageHe: buildRequestMessageHe({
            title,
            recipientName,
            documents: requestedDocuments,
            url: publicRequestUrl(token) || `/r/${token}`,
          }),
        };
        const activity = projectRequestActivity({
          id: `act-${id}`,
          request: created,
          kind: "created",
          now,
        });
        set((state) => ({
          requests: [created, ...state.requests],
          activity: [activity, ...state.activity],
          lastToast: copy.requestCreatedToast,
        }));
        return created;
      },

      markRequestOpened: (token) => {
        const now = new Date();
        set((state) => {
          const request = state.requests.find((entry) => entry.token === token);
          if (!request || request.openedAt || request.status !== "active") return state;
          const next = { ...request, openedAt: now.toISOString() };
          return {
            requests: state.requests.map((entry) => (entry.id === next.id ? next : entry)),
            activity: [
              projectRequestActivity({
                id: `act-${next.id}-opened`,
                request: next,
                kind: "opened",
                now,
              }),
              ...state.activity,
            ],
          };
        });
      },

      closeRequest: (requestId) => {
        const now = new Date();
        set((state) => {
          const request = state.requests.find((entry) => entry.id === requestId);
          if (!request || request.status !== "active") return state;
          const next = { ...request, status: "closed" as const, closedAt: now.toISOString() };
          return {
            requests: state.requests.map((entry) => (entry.id === requestId ? next : entry)),
            activity: [
              projectRequestActivity({
                id: `act-${requestId}-closed`,
                request: next,
                kind: "closed",
                now,
              }),
              ...state.activity,
            ],
            lastToast: copy.requestClosedToast,
          };
        });
      },

      reopenRequest: (requestId) => {
        const now = new Date();
        set((state) => {
          const request = state.requests.find((entry) => entry.id === requestId);
          if (!request) return state;
          const next = reopenRequest(request, now);
          if ("error" in next) {
            return { lastToast: copy.requestReopenBlocked };
          }
          return {
            requests: state.requests.map((entry) => (entry.id === requestId ? next : entry)),
            lastToast: copy.requestReopenedToast,
          };
        });
      },

      revokeRequest: (requestId) => {
        const now = new Date();
        set((state) => ({
          requests: state.requests.map((entry) =>
            entry.id === requestId
              ? { ...entry, status: "revoked" as const, revokedAt: now.toISOString() }
              : entry,
          ),
          lastToast: copy.requestRevokedToast,
        }));
      },

      extendRequestExpiry: (requestId, expiresAt) => {
        const now = new Date();
        set((state) => {
          const request = state.requests.find((entry) => entry.id === requestId);
          if (!request) return state;
          const next = extendRequestExpiry(request, expiresAt, now);
          if ("error" in next) return { lastToast: copy.requestExtendBlocked };
          return {
            requests: state.requests.map((entry) => (entry.id === requestId ? next : entry)),
            lastToast: copy.requestExtendedToast,
          };
        });
      },

      updateRequestMessage: (requestId, messageHe) => {
        set((state) => ({
          requests: state.requests.map((entry) =>
            entry.id === requestId ? { ...entry, messageHe } : entry,
          ),
        }));
      },

      startWorkerDraft: (input) => {
        const state = get();
        const request = state.requests.find((entry) => entry.id === input.requestId);
        if (!request) {
          throw new Error("request_not_found");
        }
        const worker: RequestWorkerSubmission = {
          id: newId("wsub"),
          requestId: request.id,
          submittedFullName: input.submittedFullName.trim(),
          submittedIdentityNumber: input.submittedIdentityNumber?.trim() || undefined,
          status: "draft",
        };
        const docs: RequestDocumentSubmission[] = request.requestedDocuments.map((slot) => ({
          id: newId("dsub"),
          requestId: request.id,
          workerSubmissionId: worker.id,
          requestedDocumentId: slot.id,
          status: "missing",
        }));
        set({
          workerSubmissions: [worker, ...state.workerSubmissions],
          documentSubmissions: [...docs, ...state.documentSubmissions],
        });
        return worker;
      },

      attachSlotFile: (input) => {
        get().enqueueUpload(
          input.file,
          {
            slot: {
              requestId:
                get().workerSubmissions.find((entry) => entry.id === input.workerSubmissionId)
                  ?.requestId ?? "",
              workerSubmissionId: input.workerSubmissionId,
              requestedDocumentId: input.requestedDocumentId,
            },
          },
        );
      },

      submitWorker: (workerSubmissionId) => {
        const now = new Date();
        set((state) => {
          const worker = state.workerSubmissions.find((entry) => entry.id === workerSubmissionId);
          if (!worker || isSubmittedWorker(worker)) return state;
          const activityId = `act-${worker.id}`;
          const nextWorker: RequestWorkerSubmission = {
            ...worker,
            status: "processing",
            submittedAt: now.toISOString(),
            activityId,
          };
          let world = worldFrom({
            ...state,
            workerSubmissions: state.workerSubmissions.map((entry) =>
              entry.id === worker.id ? nextWorker : entry,
            ),
          });
          if (!world.cases.some((entry) => entry.workerSubmissionId === worker.id && !entry.documentSubmissionId)) {
            world = {
              ...world,
              cases: [createWorkerCase({ worker: nextWorker, now }), ...world.cases],
            };
          }
          world = evaluateWorker(world, worker.id, now);
          return { ...applyWorld(world), lastToast: copy.workerSubmittedToast };
        });
      },

      uploadFileForSlot: (input) => {
        get().enqueueUpload(input.file, {
          slot: {
            requestId:
              get().workerSubmissions.find((entry) => entry.id === input.workerSubmissionId)
                ?.requestId ?? "",
            workerSubmissionId: input.workerSubmissionId,
            requestedDocumentId: input.requestedDocumentId,
          },
        });
      },

      enqueueUpload: (file, options) => {
        const now = new Date();
        const slot = options?.slot ?? get().ui.composerContext?.slot;
        if (!slot) return;
        const worker = get().workerSubmissions.find((entry) => entry.id === slot.workerSubmissionId);
        const document = get().documentSubmissions.find(
          (entry) =>
            entry.workerSubmissionId === slot.workerSubmissionId &&
            entry.requestedDocumentId === slot.requestedDocumentId,
        );
        if (!worker || !document) return;
        const jobId = newId("job");
        const sourceFile: SourceFile = {
          id: `file-${jobId}`,
          fileMeta: {
            name: file.name,
            mime: file.type || "image/jpeg",
            sizeLabel: fileSizeLabel(file.size),
            previewKind: previewKind(file.type),
          },
          uploadedAt: now.toISOString(),
        };
        const job: UploadJob = {
          id: jobId,
          stage: "reading",
          scenario: get().nextOutcome,
          fileMeta: sourceFile.fileMeta,
          requestId: slot.requestId,
          workerSubmissionId: slot.workerSubmissionId,
          documentSubmissionId: document.id,
          requestedDocumentId: slot.requestedDocumentId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        const wasApproved = worker.status === "approved" || worker.status === "complete";
        const nextWorker: RequestWorkerSubmission = {
          ...worker,
          status: wasApproved || worker.submittedAt ? "processing" : worker.status === "draft" ? "uploading" : "processing",
          approvedAt: wasApproved ? undefined : worker.approvedAt,
        };
        const nextDoc: RequestDocumentSubmission = {
          ...document,
          sourceFileId: sourceFile.id,
          status: "uploaded",
          uploadedAt: now.toISOString(),
        };
        const investigating = createInvestigatingCase({
          job,
          sourceFile,
          worker: { ...nextWorker, activityId: nextWorker.activityId },
          document: nextDoc,
          now,
          nextTransitionAt: new Date(now.getTime() + STAGE_DURATION_MS).toISOString(),
        });
        set((state) => ({
          jobs: [job, ...state.jobs],
          sourceFiles: [sourceFile, ...state.sourceFiles],
          workerSubmissions: state.workerSubmissions.map((entry) =>
            entry.id === worker.id ? nextWorker : entry,
          ),
          documentSubmissions: state.documentSubmissions.map((entry) =>
            entry.id === document.id ? { ...nextDoc, resolutionCaseId: investigating.id } : entry,
          ),
          cases: [investigating, ...state.cases.filter((entry) => entry.id !== investigating.id)],
          ui: { ...state.ui, composerOpen: false, composerContext: null },
        }));
      },

      tickJobs: (nowInput) => {
        const now = nowInput ?? new Date();
        const state = get();
        if (state.jobsPaused) return;
        let world = worldFrom(state);
        world = {
          ...world,
          requests: applyExpiryToRequests(world.requests, now),
        };
        let changed = false;
        for (const job of world.jobs) {
          if (!["reading", "identifying", "extracting", "matching"].includes(job.stage)) continue;
          const elapsed = now.getTime() - new Date(job.updatedAt).getTime();
          if (elapsed < STAGE_DURATION_MS) continue;
          const next = nextStage(job.stage);
          if (!next) continue;
          changed = true;
          if (next === "completed") {
            const resolution = world.cases.find((entry) => entry.jobId === job.id);
            const worker = world.workerSubmissions.find((entry) => entry.id === job.workerSubmissionId);
            const request = world.requests.find((entry) => entry.id === job.requestId);
            const slot = request?.requestedDocuments.find((entry) => entry.id === job.requestedDocumentId);
            if (resolution && worker) {
              world = applyExtraction(
                world,
                resolution.id,
                extractionForUploadScenario(
                  job.scenario ?? state.nextOutcome,
                  now,
                  slot?.label ?? "",
                  worker.submittedFullName,
                ),
                now,
              );
            }
            world = {
              ...world,
              jobs: world.jobs.map((entry) =>
                entry.id === job.id
                  ? { ...entry, stage: "completed", updatedAt: now.toISOString() }
                  : entry,
              ),
            };
          } else {
            world = {
              ...world,
              jobs: world.jobs.map((entry) =>
                entry.id === job.id ? { ...entry, stage: next, updatedAt: now.toISOString() } : entry,
              ),
            };
          }
        }
        if (changed || world.requests !== state.requests) {
          set(applyWorld(world));
        }
      },

      answerCase: (caseId, answer) => {
        const now = new Date();
        const result = applyAnswer(worldFrom(get()), caseId, answer, now);
        set({ ...applyWorld(result.world), lastToast: result.error ? copy.answerError : null });
      },

      approveWorker: (workerSubmissionId) => {
        const now = new Date();
        set((state) => {
          const worker = state.workerSubmissions.find((entry) => entry.id === workerSubmissionId);
          if (!worker || worker.status !== "complete") return state;
          const caseId = state.cases.find(
            (entry) => entry.workerSubmissionId === worker.id && !entry.documentSubmissionId,
          )?.id;
          if (caseId) {
            const result = applyAnswer(worldFrom(state), caseId, { type: "approve_worker" }, now);
            return { ...applyWorld(result.world), lastToast: copy.workerApprovedToast };
          }
          const next = {
            ...worker,
            status: "approved" as const,
            approvedAt: now.toISOString(),
            reviewedAt: now.toISOString(),
          };
          return {
            workerSubmissions: state.workerSubmissions.map((entry) =>
              entry.id === worker.id ? next : entry,
            ),
            lastToast: copy.workerApprovedToast,
          };
        });
      },

      createReuploadLink: (input) => {
        const now = new Date();
        const state = get();
        const worker = state.workerSubmissions.find((entry) => entry.id === input.workerSubmissionId);
        const request = state.requests.find((entry) => entry.id === worker?.requestId);
        const slot = request?.requestedDocuments.find((entry) => entry.id === input.requestedDocumentId);
        if (!worker || !request || !slot) return null;
        const token = makeToken("u");
        const link: RequestReuploadLink = {
          id: newId("ulink"),
          token,
          requestId: request.id,
          workerSubmissionId: worker.id,
          requestedDocumentId: slot.id,
          expiresAt: request.expiresAt,
        };
        set({
          reuploadLinks: [
            link,
            ...state.reuploadLinks.map((entry) =>
              entry.workerSubmissionId === worker.id &&
              entry.requestedDocumentId === slot.id &&
              !entry.revokedAt &&
              !entry.resolvedAt
                ? { ...entry, revokedAt: now.toISOString() }
                : entry,
            ),
          ],
          lastToast: copy.reuploadReadyToast,
        });
        return link;
      },

      submitReupload: (token, file) => {
        const state = get();
        const link = state.reuploadLinks.find((entry) => entry.token === token);
        const request = state.requests.find((entry) => entry.id === link?.requestId);
        if (!link || !request || !isReuploadLinkOpen(link, request)) return;
        get().enqueueUpload(file, {
          slot: {
            requestId: link.requestId,
            workerSubmissionId: link.workerSubmissionId,
            requestedDocumentId: link.requestedDocumentId,
          },
        });
      },

      setNextOutcome: (outcome) => set({ nextOutcome: outcome }),
      setJobsPaused: (paused) => set({ jobsPaused: paused }),
      completeActiveJobs: () => {
        const future = new Date(Date.now() + STAGE_DURATION_MS * 8);
        get().tickJobs(future);
        get().tickJobs(new Date(future.getTime() + STAGE_DURATION_MS * 8));
      },
      setDemoForce: (demoForce) => set({ demoForce }),
      resetMockData: () => {
        const seed = createRequestSeed(new Date());
        set({
          ...applyWorld(seed),
          seedAnchor: seed.seedAnchor,
          nextOutcome: "certain_match",
          jobsPaused: false,
          qaDatasetActive: false,
          lastToast: copy.demoResetDone,
        });
      },
      loadEdgeCaseQaDataset: () => {
        const dataset = createRequestQaDataset(new Date());
        set({
          ...applyWorld(dataset),
          seedAnchor: dataset.generatedAt,
          nextOutcome: "certain_match",
          jobsPaused: true,
          qaDatasetActive: true,
          lastToast: copy.demoQaLoaded,
        });
      },
      resetEdgeCaseQaDataset: () => {
        get().loadEdgeCaseQaDataset();
        set({ lastToast: copy.demoQaResetDone });
      },
      restoreRegularDemoSeed: () => {
        get().resetMockData();
        set({ lastToast: copy.demoQaRestored });
      },
    }),
    {
      name: "certify-p0",
      version: APP_STORE_VERSION,
      migrate: () => {
        const next = createRequestSeed(new Date());
        return {
          ...applyWorld(next),
          seedAnchor: next.seedAnchor,
          nextOutcome: "certain_match" as DemoScenarioId,
          jobsPaused: false,
          qaDatasetActive: false,
        };
      },
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAppStore.getState().hydrate();
      },
      partialize: (state) => ({
        seedAnchor: state.seedAnchor,
        requests: state.requests,
        workerSubmissions: state.workerSubmissions,
        documentSubmissions: state.documentSubmissions,
        reuploadLinks: state.reuploadLinks,
        activity: state.activity,
        jobs: state.jobs,
        cases: state.cases,
        sourceFiles: state.sourceFiles,
        undoLog: state.undoLog,
        nextOutcome: state.nextOutcome,
        jobsPaused: state.jobsPaused,
        qaDatasetActive: state.qaDatasetActive,
      }),
    },
  ),
);

export function selectActiveJobs(jobs: UploadJob[]) {
  return jobs.filter((job) =>
    ["reading", "identifying", "extracting", "matching"].includes(job.stage),
  );
}

export function selectPendingJobs(jobs: UploadJob[]) {
  return jobs.filter((job) => job.stage === "action_required");
}

export function canReopenStoredRequest(request: DocumentRequest, now = new Date()) {
  return canReopenRequest(request, now);
}

export function reuploadMessage(input: {
  recipientName: string;
  workerName: string;
  slotLabel: string;
  token: string;
}) {
  return buildReuploadMessageHe({
    recipientName: input.recipientName,
    workerName: input.workerName,
    slotLabel: input.slotLabel,
    url: publicReuploadUrl(input.token) || `/u/${input.token}`,
  });
}
