import { copy } from "./copy";
import type { ActivityItem } from "./types";
import type { DocumentRequest, RequestWorkerSubmission } from "./requests/types";
import { canReopenRequest, isRequestExpired } from "./requests/transitions";
import type { ResolutionCase, ResolutionProblemCode } from "./resolution/types";
import { primaryOpenCode } from "./resolution/policy";

export const AGENTIC_ACTION_KINDS = [
  "view_source_file",
  "view_request",
  "edit_worker_name",
  "edit_worker_identity",
  "confirm_extracted_field",
  "edit_extracted_field",
  "accept_document",
  "reject_document",
  "replace_uploaded_file",
  "upload_file_for_slot",
  "request_reupload",
  "confirm_slot_match",
  "move_file_to_correct_slot",
  "confirm_no_expiry",
  "enter_expiry_date",
  "approve_worker",
  "defer",
  "resume",
  "close_request",
  "reopen_request",
  "revoke_request",
  "extend_request_expiry",
  "share_whatsapp",
  "share_email",
  "copy_link",
] as const;

export type AgenticActionKind = (typeof AGENTIC_ACTION_KINDS)[number];

export function isAgenticActionKind(value: string): value is AgenticActionKind {
  return (AGENTIC_ACTION_KINDS as readonly string[]).includes(value);
}

export type AgenticActionCapability = {
  kind: AgenticActionKind;
  priority: "primary" | "secondary" | "overflow";
  labelHe: string;
  available: boolean;
};

const LABELS: Record<AgenticActionKind, string> = {
  view_source_file: copy.viewSource,
  view_request: copy.viewRequest,
  edit_worker_name: "עריכת שם העובד",
  edit_worker_identity: "עריכת מספר זהות",
  confirm_extracted_field: copy.confirmAndContinue,
  edit_extracted_field: "תקן את הנתון שחולץ",
  accept_document: "קבלת המסמך",
  reject_document: "דחיית המסמך",
  replace_uploaded_file: copy.replaceFileAction,
  upload_file_for_slot: copy.uploadForSlot,
  request_reupload: copy.requestReupload,
  confirm_slot_match: "אישור התאמה לסלוט",
  move_file_to_correct_slot: "העברה לסלוט הנכון",
  confirm_no_expiry: copy.noExpiryAction,
  enter_expiry_date: "הזנת תאריך תפוגה",
  approve_worker: copy.approveWorker,
  defer: copy.remindLater,
  resume: "המשך טיפול",
  close_request: copy.closeRequest,
  reopen_request: copy.reopenRequest,
  revoke_request: copy.revokeRequest,
  extend_request_expiry: copy.extendExpiry,
  share_whatsapp: copy.shareWhatsapp,
  share_email: copy.shareEmail,
  copy_link: copy.shareCopyLink,
};

export type AgenticActionContext = {
  resolution?: ResolutionCase;
  cases?: ResolutionCase[];
  item?: ActivityItem;
  request?: DocumentRequest;
  worker?: RequestWorkerSubmission;
  now?: Date;
  alreadyPresented?: AgenticActionKind[];
};

export function primaryProblemFor(
  ctx: AgenticActionContext,
): ResolutionProblemCode | undefined {
  if (ctx.cases?.length) return primaryOpenCode(ctx.cases);
  if (ctx.resolution) {
    const open = ctx.resolution.issues.filter((issue) => issue.state === "open");
    return open[0]?.code;
  }
  return undefined;
}

function cap(
  kind: AgenticActionKind,
  available: boolean,
  priority: AgenticActionCapability["priority"],
): AgenticActionCapability {
  return { kind, priority, labelHe: LABELS[kind], available };
}

export function capabilitiesForProblem(
  code: ResolutionProblemCode | undefined,
  ctx: AgenticActionContext,
): AgenticActionCapability[] {
  const request = ctx.request;
  const worker = ctx.worker;
  const now = ctx.now ?? new Date();
  const hasSource = Boolean(ctx.resolution?.sourceFileId || ctx.item?.sourceFileId);

  if (ctx.resolution?.state === "investigating" || ctx.resolution?.state === "resolving") {
    return [];
  }
  if (ctx.resolution?.deferredAt) {
    return [cap("resume", true, "primary"), cap("view_source_file", hasSource, "secondary")];
  }

  if (worker?.status === "complete" && !code) {
    return [cap("approve_worker", true, "primary"), cap("view_request", true, "secondary")];
  }

  if (!code && request) {
    if (request.status === "revoked") {
      return [cap("view_request", true, "primary")];
    }
    if (request.status === "expired" || isRequestExpired(request, now)) {
      return [cap("extend_request_expiry", true, "primary"), cap("share_whatsapp", true, "secondary")];
    }
    if (request.status === "closed") {
      return canReopenRequest(request, now)
        ? [cap("reopen_request", true, "primary"), cap("view_request", true, "secondary")]
        : [cap("extend_request_expiry", true, "primary"), cap("view_request", true, "secondary")];
    }
    if (request.status === "active") {
      return [
        cap("share_whatsapp", true, "primary"),
        cap("copy_link", true, "secondary"),
        cap("share_email", true, "overflow"),
        cap("close_request", true, "overflow"),
        cap("extend_request_expiry", true, "overflow"),
      ];
    }
  }

  switch (code) {
    case "worker_name_missing":
      return [cap("edit_worker_name", true, "primary"), cap("view_source_file", hasSource, "secondary")];
    case "worker_name_conflict":
      return [
        cap("edit_worker_name", true, "primary"),
        cap("confirm_extracted_field", true, "secondary"),
        cap("view_source_file", hasSource, "overflow"),
      ];
    case "worker_identity_conflict":
      return [
        cap("edit_worker_identity", true, "primary"),
        cap("confirm_extracted_field", true, "secondary"),
      ];
    case "requested_document_missing":
      return [cap("upload_file_for_slot", true, "primary"), cap("request_reupload", true, "secondary")];
    case "wrong_document_for_slot":
      return [cap("move_file_to_correct_slot", true, "primary"), cap("reject_document", true, "secondary")];
    case "slot_match_uncertain":
      return [cap("confirm_slot_match", true, "primary"), cap("move_file_to_correct_slot", true, "secondary")];
    case "file_unreadable":
      return [
        cap("upload_file_for_slot", true, "primary"),
        cap("request_reupload", true, "secondary"),
        cap("defer", true, "overflow"),
      ];
    case "field_uncertain":
      return [cap("confirm_extracted_field", true, "primary"), cap("edit_extracted_field", true, "secondary")];
    case "validity_unknown":
      return [cap("enter_expiry_date", true, "primary"), cap("confirm_no_expiry", true, "secondary")];
    case "document_expired":
      return [cap("upload_file_for_slot", true, "primary"), cap("request_reupload", true, "secondary")];
    case "duplicate_within_submission":
      return [cap("reject_document", true, "primary"), cap("view_source_file", hasSource, "secondary")];
    case "unknown":
      return [
        cap("edit_extracted_field", true, "primary"),
        cap("upload_file_for_slot", true, "secondary"),
        cap("view_source_file", hasSource, "overflow"),
        cap("defer", true, "overflow"),
      ];
    default:
      return hasSource
        ? [cap("view_source_file", true, "primary"), cap("view_request", Boolean(request), "secondary")]
        : [cap("view_request", Boolean(request), "primary")];
  }
}

export function visibleCapabilities(caps: AgenticActionCapability[]) {
  return caps.filter((entry) => entry.available && entry.priority !== "overflow").slice(0, 2);
}
