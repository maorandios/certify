import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fileSizeLabel, isoDaysFrom } from "./dates";
import { copy, documentTypeLabels } from "./copy";
import { buildRenewMessageHe, makeToken, publicRequestUrl } from "./links";
import { createSeed } from "./mock/seed";
import { stampActivity } from "./activityOpen";
import {
  applyTargetedAssignment,
  applyUploadOutcome,
  buildHappyPathExtraction,
  nextStage,
  STAGE_DURATION_MS,
} from "./mock/uploadMachine";
import type {
  ActivityActionKind,
  ActivityItem,
  DocumentRecord,
  DocumentRequest,
  DocumentTypeId,
  Employee,
  MockUploadOutcome,
  ShareLink,
  UploadJob,
} from "./types";

export type ComposerContext = {
  /** replace_file flow: activity resolved when this upload completes. */
  resolvesActivityId?: string;
  /** Upload scoped to a known employee (from employee details / renew). */
  target?: {
    employeeId: string;
    typeId?: DocumentTypeId;
    replacesDocumentId?: string;
  };
} | null;

export type DemoForcedState = "empty" | "loading" | "error" | null;

type UiState = {
  composerOpen: boolean;
  composerContext: ComposerContext;
  jobsSheetOpen: boolean;
  focusedJobId: string | null;
  hydrated: boolean;
};

export type EmployeeInput = {
  fullName: string;
  identityNumber: string;
  profileImage?: string;
  description?: string;
};

type AppState = {
  /**
   * ISO timestamp of when the seed data was generated. All time-relative
   * status math must use this anchor instead of `new Date()` so the server
   * and client render identical HTML (avoids hydration errors).
   */
  seedAnchor: string;
  employees: Employee[];
  documents: DocumentRecord[];
  activity: ActivityItem[];
  jobs: UploadJob[];
  shares: ShareLink[];
  requests: DocumentRequest[];
  nextOutcome: MockUploadOutcome;
  jobsPaused: boolean;
  demoForce: DemoForcedState;
  ui: UiState;
  lastToast: string | null;

  hydrate: () => void;
  openComposer: (context?: ComposerContext) => void;
  closeComposer: () => void;
  openJobsSheet: (jobId?: string) => void;
  closeJobsSheet: () => void;
  consumeToast: () => void;

  enqueueUpload: (file: { name: string; type: string; size: number }) => void;
  tickJobs: (now?: Date) => void;

  addEmployee: (input: EmployeeInput) => Employee;
  updateEmployee: (id: string, patch: Partial<EmployeeInput>) => void;

  assignActivityToEmployee: (activityId: string, employeeId: string) => void;
  createEmployeeFromActivity: (
    activityId: string,
    input: EmployeeInput,
  ) => Employee;
  confirmActivityField: (activityId: string, value: string) => void;
  confirmDocumentField: (documentId: string, value: string) => void;
  decideReplacement: (
    activityId: string,
    decision: "replace" | "keep_both" | "discard",
  ) => void;
  resolveActivity: (activityId: string) => void;

  createShare: (input: {
    employeeIds: string[];
    documentIds: string[];
  }) => ShareLink;
  createDocumentRequest: (input: {
    employeeId: string;
    documentType?: DocumentTypeId;
    replacesDocumentId?: string;
  }) => DocumentRequest;
  updateRequestMessage: (requestId: string, messageHe: string) => void;
  markRequestSent: (requestId: string, activityId?: string) => void;
  markRequestOpened: (token: string) => void;
  submitRequestUpload: (
    token: string,
    file: { name: string; type: string; size: number },
  ) => void;

  setNextOutcome: (outcome: MockUploadOutcome) => void;
  setJobsPaused: (paused: boolean) => void;
  completeActiveJobs: () => void;
  setDemoForce: (state: DemoForcedState) => void;
  resetMockData: () => void;
  addDemoDocument: (kind: "expiring" | "expired") => void;
  triggerDemoAction: (kind: ActivityActionKind) => void;
  createDemoShare: (expired?: boolean) => ShareLink;
  createDemoRequest: () => DocumentRequest | null;
};

const seed = createSeed();

function previewKind(mime: string): "image" | "pdf" {
  return mime.includes("pdf") ? "pdf" : "image";
}

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveItem(
  activity: ActivityItem[],
  activityId: string,
  at = new Date(),
) {
  const resolvedAt = at.toISOString();
  return activity.map((item) =>
    item.id === activityId
      ? { ...item, resolved: true, resolvedAt }
      : item,
  );
}

function completeJob(jobs: UploadJob[], jobId: string | undefined, now: Date) {
  if (!jobId) return jobs;
  return jobs.map((job) =>
    job.id === jobId
      ? { ...job, stage: "completed" as const, updatedAt: now.toISOString() }
      : job,
  );
}

const OUTCOME_FOR_ACTION: Partial<
  Record<ActivityActionKind, MockUploadOutcome>
> = {
  select_employee: "ambiguous_employee",
  create_employee: "employee_not_found",
  confirm_field: "uncertain_field",
  replace_file: "unreadable_file",
  confirm_replacement: "uncertain_replacement",
};

export const APP_STORE_VERSION = 10;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      seedAnchor: seed.generatedAt,
      employees: seed.employees,
      documents: seed.documents,
      activity: seed.activity,
      jobs: seed.jobs,
      shares: [],
      requests: [],
      nextOutcome: "certain_match",
      jobsPaused: false,
      demoForce: null,
      lastToast: null,
      ui: {
        composerOpen: false,
        composerContext: null,
        jobsSheetOpen: false,
        focusedJobId: null,
        hydrated: false,
      },

      hydrate: () =>
        set((state) => ({
          ui: { ...state.ui, hydrated: true },
        })),
      openComposer: (context = null) =>
        set((state) => ({
          ui: { ...state.ui, composerOpen: true, composerContext: context },
        })),
      closeComposer: () =>
        set((state) => ({
          ui: { ...state.ui, composerOpen: false, composerContext: null },
        })),
      openJobsSheet: (jobId) =>
        set((state) => ({
          ui: {
            ...state.ui,
            jobsSheetOpen: true,
            focusedJobId: jobId ?? null,
          },
        })),
      closeJobsSheet: () =>
        set((state) => ({
          ui: { ...state.ui, jobsSheetOpen: false, focusedJobId: null },
        })),
      consumeToast: () => set({ lastToast: null }),

      enqueueUpload: (file) => {
        const now = new Date();
        const context = get().ui.composerContext;
        const job: UploadJob = {
          id: newId("job"),
          stage: "reading",
          fileMeta: {
            name: file.name,
            mime: file.type || "application/octet-stream",
            sizeLabel: fileSizeLabel(file.size),
            previewKind: previewKind(file.type),
            pages: previewKind(file.type) === "pdf" ? 1 : undefined,
          },
          extracted: buildHappyPathExtraction(now),
          resolvesActivityId: context?.resolvesActivityId,
          // A pre-assigned employee makes the job skip the outcome machine
          // and go through targeted assignment instead.
          assignedEmployeeId: context?.target?.employeeId,
          replacedDocumentId: context?.target?.replacesDocumentId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        set((state) => ({
          jobs: [job, ...state.jobs],
          ui: { ...state.ui, composerOpen: false, composerContext: null },
        }));
      },

      tickJobs: (now = new Date()) => {
        const state = get();
        if (state.jobsPaused) return;
        const { jobs, employees, documents, activity } = state;
        const processing = jobs.filter((job) =>
          ["reading", "identifying", "extracting", "matching"].includes(
            job.stage,
          ),
        );
        const hasStale = jobs.some(
          (job) =>
            (job.stage === "completed" || job.stage === "failed") &&
            now.getTime() - new Date(job.updatedAt).getTime() >= 2500,
        );
        if (processing.length === 0 && !hasStale) return;

        let nextDocuments = documents;
        let nextActivity = activity;
        const nextRequests = state.requests;
        let nextOutcomeState = state.nextOutcome;
        let toast: string | null = state.lastToast;

        const nextJobs = jobs.map((job) => {
          if (
            !["reading", "identifying", "extracting", "matching"].includes(
              job.stage,
            )
          ) {
            return job;
          }
          const elapsed = now.getTime() - new Date(job.updatedAt).getTime();
          if (elapsed < STAGE_DURATION_MS) return job;
          const upcoming = nextStage(job.stage);
          if (!upcoming) return job;
          if (upcoming !== "completed") {
            return { ...job, stage: upcoming, updatedAt: now.toISOString() };
          }

          // Job finished its processing stages: apply the simulated outcome.
          if (job.assignedEmployeeId) {
            const result = applyTargetedAssignment({
              employees,
              documents: nextDocuments,
              job,
              target: {
                employeeId: job.assignedEmployeeId,
                replacesDocumentId: job.replacedDocumentId,
              },
              now,
            });
            nextDocuments = result.documents;
            let items = result.activity;
            if (job.sourceRequestId) {
              const request = nextRequests.find(
                (entry) => entry.id === job.sourceRequestId,
              );
              const employee = employees.find(
                (entry) => entry.id === request?.employeeId,
              );
              items = items.map((item) => ({
                ...item,
                titleHe: employee
                  ? `${employee.fullName} העלה מסמך חדש דרך קישור הבקשה`
                  : item.titleHe,
              }));
            }
            nextActivity = [...items, ...nextActivity].slice(0, 60);
            toast = result.toastHe;
            if (job.resolvesActivityId) {
              nextActivity = resolveItem(nextActivity, job.resolvesActivityId);
            }
            return result.job;
          }

          const outcome = job.outcome ?? nextOutcomeState;
          nextOutcomeState = "certain_match";
          const result = applyUploadOutcome({
            employees,
            documents: nextDocuments,
            job,
            outcome,
            now,
          });
          nextDocuments = result.documents;
          nextActivity = [...result.activity, ...nextActivity].slice(0, 60);
          toast = result.toastHe;
          if (job.resolvesActivityId && result.job.stage === "completed") {
            nextActivity = resolveItem(nextActivity, job.resolvesActivityId);
          }
          return result.job;
        });

        set({
          jobs: nextJobs.filter((job) => {
            if (job.stage === "completed" || job.stage === "failed") {
              const age = now.getTime() - new Date(job.updatedAt).getTime();
              return age < 2500;
            }
            return true;
          }),
          documents: nextDocuments,
          activity: nextActivity,
          requests: nextRequests,
          nextOutcome: nextOutcomeState,
          lastToast: toast,
        });
      },

      addEmployee: (input) => {
        const now = new Date();
        const employee: Employee = {
          id: newId("emp"),
          fullName: input.fullName.trim(),
          identityNumber: input.identityNumber.trim(),
          profileImage: input.profileImage,
          description: input.description?.trim() || undefined,
          createdAt: now.toISOString(),
        };
        set((state) => ({
          employees: [employee, ...state.employees],
          lastToast: copy.formCreatedToast(employee.fullName),
        }));
        return employee;
      },

      updateEmployee: (id, patch) => {
        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === id
              ? {
                  ...employee,
                  ...patch,
                  fullName: patch.fullName?.trim() ?? employee.fullName,
                  identityNumber:
                    patch.identityNumber?.trim() ?? employee.identityNumber,
                  description:
                    patch.description !== undefined
                      ? patch.description.trim() || undefined
                      : employee.description,
                }
              : employee,
          ),
          lastToast: copy.formUpdatedToast,
        }));
      },

      assignActivityToEmployee: (activityId, employeeId) => {
        const now = new Date();
        const state = get();
        const item = state.activity.find((entry) => entry.id === activityId);
        const job = state.jobs.find((entry) => entry.id === item?.jobId);
        const employee = state.employees.find(
          (entry) => entry.id === employeeId,
        );
        if (!item || !employee) return;

        const extracted = job?.extracted;
        const typeId = extracted?.typeId ?? "safety";
        const document: DocumentRecord = {
          id: newId("doc"),
          employeeId: employee.id,
          typeId,
          title: extracted?.title ?? documentTypeLabels[typeId],
          issuedOn: extracted?.issuedOn,
          expiresOn: extracted?.expiresOn,
          issuer: extracted?.issuer,
          credentialNumber: extracted?.credentialNumber,
          permissionsHe: extracted?.permissionsHe,
          lifecycle: "active",
          processingStatus: "ready",
          fileMeta: job?.fileMeta ?? {
            name: "document.jpg",
            mime: "image/jpeg",
            sizeLabel: "1.0 MB",
            previewKind: "image",
          },
          warningDays: 30,
          createdAt: now.toISOString(),
        };

        const update = stampActivity({
          id: newId("act"),
          type: "update",
          titleHe: copy.assignedFeedTitle(document.title),
          employeeId: employee.id,
          documentId: document.id,
          jobId: job?.id,
          timestamp: now.toISOString(),
          metadataHe: document.title,
          openBehavior: "document_viewer",
        });

        set((current) => ({
          documents: [...current.documents, document],
          activity: [update, ...resolveItem(current.activity, activityId)],
          jobs: completeJob(current.jobs, job?.id, now),
          lastToast: copy.assignedToast(document.title, employee.fullName),
        }));
      },

      createEmployeeFromActivity: (activityId, input) => {
        const now = new Date();
        const employee: Employee = {
          id: newId("emp"),
          fullName: input.fullName.trim(),
          identityNumber: input.identityNumber.trim(),
          profileImage: input.profileImage,
          description: input.description?.trim() || undefined,
          createdAt: now.toISOString(),
        };
        set((state) => ({ employees: [employee, ...state.employees] }));
        get().assignActivityToEmployee(activityId, employee.id);
        return employee;
      },

      confirmActivityField: (activityId, value) => {
        const now = new Date();
        const state = get();
        const item = state.activity.find((entry) => entry.id === activityId);
        if (!item?.documentId) return;
        const fieldKey = item.fieldKey ?? "expiresOn";

        set((current) => {
          const documents = current.documents.map((document) => {
            if (document.id !== item.documentId) return document;
            const next = { ...document };
            if (fieldKey === "expiresOn") next.expiresOn = value;
            if (fieldKey === "identityNumber") {
              // Identity lives on the employee; keep the document untouched.
            }
            next.lifecycle = "active";
            next.processingStatus = "ready";
            next.uncertainFieldKeys = undefined;
            return next;
          });
          const target = documents.find(
            (document) => document.id === item.documentId,
          );
          const update = stampActivity({
            id: newId("act"),
            type: "update",
            titleHe: "הפרט אושר והמסמך סומן כפעיל",
            employeeId: item.employeeId,
            documentId: item.documentId,
            timestamp: now.toISOString(),
            metadataHe: target ? documentTypeLabels[target.typeId] : undefined,
            openBehavior: "document_viewer",
          });
          return {
            documents,
            activity: [update, ...resolveItem(current.activity, activityId)],
            jobs: completeJob(current.jobs, item.jobId, now),
            lastToast: copy.sheetResolvedToast,
          };
        });
      },

      confirmDocumentField: (documentId, value) => {
        const state = get();
        const pending = state.activity.find(
          (entry) =>
            !entry.resolved &&
            entry.documentId === documentId &&
            entry.actionKind === "confirm_field",
        );
        if (pending) {
          get().confirmActivityField(pending.id, value);
          return;
        }

        const now = new Date();
        const document = state.documents.find((entry) => entry.id === documentId);
        if (!document) return;

        set((current) => {
          const documents = current.documents.map((entry) =>
            entry.id === documentId
              ? {
                  ...entry,
                  expiresOn: value,
                  lifecycle: "active" as const,
                  processingStatus: "ready" as const,
                  uncertainFieldKeys: undefined,
                }
              : entry,
          );
          const update = stampActivity({
            id: newId("act"),
            type: "update",
            titleHe: "הפרט אושר והמסמך סומן כפעיל",
            employeeId: document.employeeId,
            documentId,
            timestamp: now.toISOString(),
            metadataHe: documentTypeLabels[document.typeId],
            openBehavior: "document_viewer",
          });
          return {
            documents,
            activity: [update, ...current.activity],
            lastToast: copy.sheetResolvedToast,
          };
        });
      },

      decideReplacement: (activityId, decision) => {
        const now = new Date();
        const state = get();
        const item = state.activity.find((entry) => entry.id === activityId);
        if (!item?.pendingDocumentId) return;

        set((current) => {
          let documents = current.documents;
          let titleHe = "";
          if (decision === "replace") {
            documents = documents.map((document) => {
              if (document.id === item.documentId) {
                return { ...document, lifecycle: "superseded" as const };
              }
              if (document.id === item.pendingDocumentId) {
                return {
                  ...document,
                  lifecycle: "active" as const,
                  processingStatus: "ready" as const,
                  uncertainFieldKeys: undefined,
                };
              }
              return document;
            });
            titleHe = copy.replacedFeedTitle;
          } else if (decision === "keep_both") {
            documents = documents.map((document) =>
              document.id === item.pendingDocumentId
                ? {
                    ...document,
                    lifecycle: "active" as const,
                    processingStatus: "ready" as const,
                    uncertainFieldKeys: undefined,
                  }
                : document,
            );
            titleHe = "שני המסמכים נשארו פעילים";
          } else {
            documents = documents.filter(
              (document) => document.id !== item.pendingDocumentId,
            );
            titleHe = "המסמך הכפול לא נשמר";
          }

          const update = stampActivity({
            id: newId("act"),
            type: "update",
            titleHe,
            employeeId: item.employeeId,
            documentId:
              decision === "discard" ? item.documentId : item.pendingDocumentId,
            timestamp: now.toISOString(),
            metadataHe: item.metadataHe,
            openBehavior: "document_viewer",
          });

          return {
            documents,
            activity: [update, ...resolveItem(current.activity, activityId)],
            jobs: completeJob(current.jobs, item.jobId, now),
            lastToast: copy.sheetResolvedToast,
          };
        });
      },

      resolveActivity: (activityId) => {
        set((state) => ({
          activity: resolveItem(state.activity, activityId),
        }));
      },

      createShare: (input) => {
        const now = new Date();
        const share: ShareLink = {
          id: newId("share"),
          token: makeToken("s"),
          employeeIds: input.employeeIds,
          documentIds: input.documentIds,
          createdAt: now.toISOString(),
          expiresAt: isoDaysFrom(now, 7),
          status: "active",
        };
        set((state) => ({ shares: [share, ...state.shares] }));
        return share;
      },

      createDocumentRequest: (input) => {
        const now = new Date();
        const state = get();
        const employee = state.employees.find(
          (entry) => entry.id === input.employeeId,
        );
        const replaced = state.documents.find(
          (entry) => entry.id === input.replacesDocumentId,
        );
        const token = makeToken("r");
        const documentTitle = replaced
          ? documentTypeLabels[replaced.typeId]
          : input.documentType
            ? documentTypeLabels[input.documentType]
            : "האישור";
        const expired = replaced?.expiresOn
          ? new Date(`${replaced.expiresOn}T12:00:00`).getTime() < now.getTime()
          : false;
        const request: DocumentRequest = {
          id: newId("req"),
          token,
          employeeId: input.employeeId,
          documentType: input.documentType ?? replaced?.typeId,
          replacesDocumentId: input.replacesDocumentId,
          messageHe: buildRenewMessageHe({
            employeeName: employee?.fullName ?? "",
            documentTitle,
            url: publicRequestUrl(token),
            expired,
          }),
          createdAt: now.toISOString(),
          expiresAt: isoDaysFrom(now, 14),
          status: "created",
        };
        set((current) => ({
          requests: [request, ...current.requests],
          lastToast: copy.requestCreatedToast,
        }));
        return request;
      },

      updateRequestMessage: (requestId, messageHe) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === requestId ? { ...request, messageHe } : request,
          ),
        }));
      },

      markRequestSent: (requestId, activityId) => {
        const now = new Date();
        const state = get();
        const request = state.requests.find((entry) => entry.id === requestId);
        const employee = state.employees.find(
          (entry) => entry.id === request?.employeeId,
        );
        const update = stampActivity({
          id: newId("act"),
          type: "update",
          titleHe: copy.requestSentFeedTitle(employee?.fullName ?? "העובד"),
          employeeId: request?.employeeId,
          requestId,
          timestamp: now.toISOString(),
          metadataHe: request?.documentType
            ? documentTypeLabels[request.documentType]
            : undefined,
          openBehavior: request?.employeeId ? "employee_details" : "none",
        });
        set((current) => ({
          activity: [
            update,
            ...(activityId
              ? resolveItem(current.activity, activityId)
              : current.activity),
          ],
        }));
      },

      markRequestOpened: (token) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.token === token && request.status === "created"
              ? { ...request, status: "opened" as const }
              : request,
          ),
        }));
      },

      submitRequestUpload: (token, file) => {
        const now = new Date();
        const state = get();
        const request = state.requests.find((entry) => entry.token === token);
        if (!request) return;

        const job: UploadJob = {
          id: newId("job"),
          stage: "reading",
          fileMeta: {
            name: file.name,
            mime: file.type || "application/octet-stream",
            sizeLabel: fileSizeLabel(file.size),
            previewKind: previewKind(file.type),
          },
          assignedEmployeeId: request.employeeId,
          replacedDocumentId: request.replacesDocumentId,
          sourceRequestId: request.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        set((current) => ({
          requests: current.requests.map((entry) =>
            entry.id === request.id
              ? { ...entry, status: "uploaded" as const }
              : entry,
          ),
          jobs: [job, ...current.jobs],
        }));
      },

      setNextOutcome: (outcome) => set({ nextOutcome: outcome }),
      setJobsPaused: (paused) => set({ jobsPaused: paused }),

      completeActiveJobs: () => {
        const now = new Date();
        const state = get();
        // Fast-forward: mark every processing job as due, then tick until done.
        set({
          jobs: state.jobs.map((job) =>
            ["reading", "identifying", "extracting", "matching"].includes(
              job.stage,
            )
              ? {
                  ...job,
                  stage: "matching" as const,
                  updatedAt: new Date(
                    now.getTime() - STAGE_DURATION_MS - 50,
                  ).toISOString(),
                }
              : job,
          ),
          jobsPaused: false,
        });
        get().tickJobs(now);
      },

      setDemoForce: (value) => set({ demoForce: value }),

      resetMockData: () => {
        const fresh = createSeed();
        set({
          seedAnchor: fresh.generatedAt,
          employees: fresh.employees,
          documents: fresh.documents,
          activity: fresh.activity,
          jobs: fresh.jobs,
          shares: [],
          requests: [],
          nextOutcome: "certain_match",
          jobsPaused: false,
          demoForce: null,
          lastToast: copy.demoResetDone,
        });
      },

      addDemoDocument: (kind) => {
        const now = new Date();
        const state = get();
        const employee =
          state.employees.find((entry) => entry.id === "emp-roi") ??
          state.employees[0];
        if (!employee) return;
        const expiresOn =
          kind === "expiring" ? isoDaysFrom(now, 10) : isoDaysFrom(now, -3);
        const document: DocumentRecord = {
          id: newId("doc"),
          employeeId: employee.id,
          typeId: "safety",
          title: documentTypeLabels.safety,
          issuedOn: isoDaysFrom(now, -300),
          expiresOn,
          issuer: "קצין הבטיחות באתר",
          credentialNumber: `SF-${now.getTime().toString().slice(-4)}`,
          lifecycle: "active",
          processingStatus: "ready",
          fileMeta: {
            name: "demo-safety.jpg",
            mime: "image/jpeg",
            sizeLabel: "1.0 MB",
            previewKind: "image",
            pages: 1,
          },
          warningDays: 30,
          createdAt: now.toISOString(),
        };
        const alert = stampActivity({
          id: newId("act"),
          type: "alert",
          titleHe:
            kind === "expiring"
              ? `הדרכת הבטיחות של ${employee.fullName} תפוג בעוד 10 ימים`
              : `הדרכת הבטיחות של ${employee.fullName} פגה לפני 3 ימים`,
          employeeId: employee.id,
          documentId: document.id,
          timestamp: now.toISOString(),
          openBehavior: "document_viewer",
        });
        set((current) => ({
          documents: [...current.documents, document],
          activity: [alert, ...current.activity],
        }));
      },

      triggerDemoAction: (kind) => {
        const now = new Date();
        const state = get();

        const outcome = OUTCOME_FOR_ACTION[kind];
        if (!outcome) return;
        const job: UploadJob = {
          id: newId("job"),
          stage: "matching",
          fileMeta: {
            name: "demo-upload.jpg",
            mime: "image/jpeg",
            sizeLabel: "1.4 MB",
            previewKind: "image",
            pages: 1,
          },
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        const result = applyUploadOutcome({
          employees: state.employees,
          documents: state.documents,
          job,
          outcome,
          now,
        });
        set((current) => ({
          documents: result.documents,
          activity: [...result.activity, ...current.activity].slice(0, 60),
          jobs:
            result.job.stage === "action_required"
              ? [result.job, ...current.jobs]
              : current.jobs,
          lastToast: result.toastHe,
        }));
      },

      createDemoShare: (expired = false) => {
        const now = new Date();
        const state = get();
        const employeeIds = ["emp-yosef", "emp-natan"].filter((id) =>
          state.employees.some((employee) => employee.id === id),
        );
        const documentIds = state.documents
          .filter(
            (document) =>
              employeeIds.includes(document.employeeId) &&
              document.lifecycle === "active",
          )
          .map((document) => document.id);
        const share: ShareLink = {
          id: newId("share"),
          token: makeToken("s"),
          employeeIds,
          documentIds,
          createdAt: now.toISOString(),
          expiresAt: expired ? isoDaysFrom(now, -1) : isoDaysFrom(now, 7),
          status: expired ? "expired" : "active",
        };
        set((current) => ({ shares: [share, ...current.shares] }));
        return share;
      },

      createDemoRequest: () => {
        const state = get();
        const expiredDoc = state.documents.find(
          (document) =>
            document.lifecycle === "active" &&
            document.expiresOn &&
            new Date(`${document.expiresOn}T12:00:00`).getTime() < Date.now(),
        );
        if (!expiredDoc) return null;
        return get().createDocumentRequest({
          employeeId: expiredDoc.employeeId,
          replacesDocumentId: expiredDoc.id,
        });
      },
    }),
    {
      name: "certify-p0",
      version: APP_STORE_VERSION,
      migrate: () => {
        const next = createSeed();
        return {
          seedAnchor: next.generatedAt,
          employees: next.employees,
          documents: next.documents,
          activity: next.activity,
          jobs: next.jobs,
          shares: [],
          requests: [],
          nextOutcome: "certain_match" as const,
        };
      },
      skipHydration: true,
      partialize: (state) => ({
        seedAnchor: state.seedAnchor,
        employees: state.employees,
        documents: state.documents,
        activity: state.activity,
        jobs: state.jobs,
        shares: state.shares,
        requests: state.requests,
        nextOutcome: state.nextOutcome,
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
