"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlarmClock,
  Ban,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  CircleX,
  CloudUpload,
  FileText,
  Paperclip,
  LinkIcon,
  LoaderCircle,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { fileSizeLabel, formatHeDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { JobRunner } from "@/components/shell/JobRunner";
import { PublicBrand } from "@/components/public/PublicBrand";
import { PublicHydrator } from "@/components/public/PublicHydrator";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const UPLOAD_MS = 900;
const ACCEPTED_FILES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".ifc",
  ".dwg",
].join(",");
const ALLOWED_EXT = /\.(jpe?g|png|pdf|docx?|xlsx?|pptx?|ifc|dwg)$/i;
const SLIDE = { type: "tween" as const, duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const submitClassName =
  "min-h-[calc(3.5rem*1.15)] w-full border-[3px] !border-[#FFDCC9] text-[16.5px] !text-[#252525] [&_svg]:!text-[#252525]";

type SlotFile = {
  id: string;
  file: File;
  status: "uploading" | "ready";
};

function isAllowed(file: File) {
  return ALLOWED_EXT.test(file.name);
}

function Note({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="grid justify-items-center gap-3 py-8 text-center">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-[14px] text-stone-500">{body}</p>
    </div>
  );
}

function RequestUpload() {
  const params = useParams<{ token: string }>();
  const requests = useAppStore((state) => state.requests);
  const markRequestOpened = useAppStore((state) => state.markRequestOpened);
  const startWorkerDraft = useAppStore((state) => state.startWorkerDraft);
  const attachSlotFile = useAppStore((state) => state.attachSlotFile);
  const submitWorker = useAppStore((state) => state.submitWorker);
  const [filesBySlot, setFilesBySlot] = useState<Record<string, SlotFile[]>>({});
  const [done, setDone] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const openedAt = useMemo(() => new Date(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [openSlots, setOpenSlots] = useState<Record<string, boolean>>({});
  const sessionWorkerIds = useRef<string[]>([]);
  const uploadTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = uploadTimers.current;
    return () => {
      Object.values(timers).forEach((id) => window.clearTimeout(id));
    };
  }, []);


  const request = requests.find((entry) => entry.token === params.token);

  useEffect(() => {
    if (request?.status === "active" && !request.openedAt) {
      markRequestOpened(request.token);
    }
  }, [request?.id, request?.openedAt, request?.status, request?.token, markRequestOpened]);

  if (!request) {
    return (
      <Note
        icon={<LinkIcon className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestInvalidTitle}
        body={copy.requestExpiredBody}
      />
    );
  }

  if (request.status === "revoked") {
    return (
      <Note
        icon={<Ban className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestCancelledTitle}
        body={copy.requestCancelledBody}
      />
    );
  }
  if (request.status === "closed") {
    return (
      <Note
        icon={<Ban className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestClosedTitle}
        body={copy.requestClosedBody}
      />
    );
  }
  if (request.status === "expired" || new Date(request.expiresAt).getTime() < openedAt.getTime()) {
    return (
      <Note
        icon={<TimerOff className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestExpiredTitle}
        body={copy.requestExpiredBody}
      />
    );
  }

  if (done) {
    return (
      <div className="grid justify-items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-[var(--status-ok,#15803D)]" aria-hidden />
        <h2 className="text-lg font-semibold">{copy.requestSuccessTitle}</h2>
        <p className="max-w-sm text-[14px] text-stone-500">{copy.requestSuccessBody}</p>
        <Button
          className={submitClassName}
          onClick={() => {
            setDone(false);
            setFilesBySlot({});
            setFileError(null);
            sessionWorkerIds.current = [];
          }}
        >
          {copy.requestAddAnother}
        </Button>
      </div>
    );
  }

  const slots = request.requestedDocuments;
  const allFiles = Object.values(filesBySlot).flat();
  const uploading = allFiles.some((entry) => entry.status === "uploading");
  const readyCount = allFiles.filter((entry) => entry.status === "ready").length;

  function workerForSlot(slotId: string) {
    const state = useAppStore.getState();
    for (const id of sessionWorkerIds.current) {
      const openSlot = state.documentSubmissions.find(
        (entry) =>
          entry.workerSubmissionId === id &&
          entry.requestedDocumentId === slotId &&
          !entry.sourceFileId,
      );
      if (openSlot) return id;
    }
    const worker = startWorkerDraft({
      requestId: request.id,
      submittedFullName: request.recipient.name,
    });
    sessionWorkerIds.current.push(worker.id);
    return worker.id;
  }

  function finishUpload(slotId: string, item: SlotFile) {
    const workerId = workerForSlot(slotId);
    attachSlotFile({
      workerSubmissionId: workerId,
      requestedDocumentId: slotId,
      file: item.file,
    });
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: (current[slotId] ?? []).map((entry) =>
        entry.id === item.id ? { ...entry, status: "ready" } : entry,
      ),
    }));
  }

  function addFiles(slotId: string, list: FileList | null) {
    if (!list?.length) return;
    const next: SlotFile[] = [];
    for (const file of Array.from(list)) {
      if (!isAllowed(file)) {
        setFileError(copy.requestInvalidType);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFileError(copy.requestFileTooLarge);
        return;
      }
      next.push({ id: crypto.randomUUID(), file, status: "uploading" });
    }
    setFileError(null);
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: [...(current[slotId] ?? []), ...next],
    }));
    for (const item of next) {
      uploadTimers.current[item.id] = window.setTimeout(() => {
        delete uploadTimers.current[item.id];
        finishUpload(slotId, item);
      }, UPLOAD_MS);
    }
  }

  function removeFile(slotId: string, id: string) {
    const timer = uploadTimers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete uploadTimers.current[id];
    }
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: (current[slotId] ?? []).filter((entry) => entry.id !== id),
    }));
  }

  function handleSubmit() {
    if (!request || readyCount === 0 || uploading) return;
    sessionWorkerIds.current.forEach((id) => submitWorker(id));
    setDone(true);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-[24px] bg-[#2B2B2B] px-[1.65rem] py-7 text-start">
        <h2 className="flex items-center gap-2 font-semibold text-[#FF5900]">
          <CloudUpload className="size-5 shrink-0" aria-hidden />
          <span className="text-[13.6px]">{copy.requestCollectTitle}</span>
        </h2>
        <div className="text-[15px] leading-relaxed text-[#FFFDFB]/80">
          <p>{copy.requestHello(request.recipient.name)}</p>
          <p>{copy.requestLetterFrom(copy.operatorName, request.title)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold">
            <span>{copy.requestLinkValidUntil}</span>
            <AlarmClock className="size-3.5 shrink-0" aria-hidden />
            <span>{formatHeDate(request.expiresAt.slice(0, 10))}</span>
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {slots.map((slot, index) => {
          const files = filesBySlot[slot.id] ?? [];
          const expanded = openSlots[slot.id] ?? index === 0;
          return (
            <div
              key={slot.id}
              className="overflow-hidden rounded-[20px] border border-[#2B2B2B] bg-transparent"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start"
                aria-expanded={expanded}
                onClick={() =>
                  setOpenSlots((current) => ({
                    ...current,
                    [slot.id]: !expanded,
                  }))
                }
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-stone-400" aria-hidden />
                  <span className="truncate text-[13.5px] font-semibold text-[#252525]">
                    {slot.label}
                    {files.length ? (
                      <>
                        <span className="px-1.5 font-normal text-stone-300" aria-hidden>
                          ·
                        </span>
                        <span className="font-medium text-stone-400">
                          {copy.requestFileCount(files.length)}
                        </span>
                      </>
                    ) : null}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-stone-400 transition-transform duration-300",
                    expanded && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={SLIDE}
                    className="min-w-0 overflow-hidden"
                  >
                    <div className="grid min-w-0 gap-2 px-4 pb-4">
                      {files.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex min-w-0 items-center gap-2 overflow-hidden rounded-full border border-[var(--line)] px-3 py-2"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                            <Paperclip className="size-4 shrink-0 text-stone-400" aria-hidden />
                            <span className="min-w-0 flex-1 truncate text-[12.15px] font-medium text-[#252525]">
                              {entry.file.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10.8px] text-stone-400">
                            {fileSizeLabel(entry.file.size)}
                          </span>
                          {entry.status === "uploading" ? (
                            <span className="flex size-7 shrink-0 items-center justify-center text-stone-400">
                              <LoaderCircle className="size-4 animate-spin" aria-hidden />
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="flex size-7 shrink-0 items-center justify-center text-stone-400"
                              aria-label={copy.requestRemoveFile}
                              onClick={() => removeFile(slot.id, entry.id)}
                            >
                              <CircleX className="size-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="flex items-center gap-2 self-start py-1 text-[12.15px] font-medium text-stone-400"
                        onClick={() => {
                          setActiveSlot(slot.id);
                          window.setTimeout(() => fileRef.current?.click(), 0);
                        }}
                      >
                        <CirclePlus className="size-[18px]" aria-hidden />
                        {copy.requestAddFile}
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {fileError ? <p className="text-[13px] text-[var(--status-bad)]">{fileError}</p> : null}
      <div className="grid gap-2">
        <Button
          className={submitClassName}
          disabled={readyCount === 0 || uploading}
          onClick={handleSubmit}
        >
          {copy.requestSubmitFiles}
        </Button>
        <p className="text-center text-[12px] text-stone-400">
          {copy.requestMaxFileHint} · {copy.requestPrivacyNote}
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(event) => {
          if (activeSlot) addFiles(activeSlot, event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export default function PublicRequestPage() {
  return (
    <PublicHydrator>
      <div className="min-h-svh bg-[#FFFDFB] px-4 py-6">
        <JobRunner />
        <div className="mx-auto grid max-w-md gap-6">
          <PublicBrand subtitle={copy.publicSlogan} />
          <RequestUpload />
        </div>
      </div>
    </PublicHydrator>
  );
}
