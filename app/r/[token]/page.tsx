"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Ban,
  Camera,
  CheckCircle2,
  FileText,
  ImageIcon,
  LinkIcon,
  TimerOff,
} from "lucide-react";
import { copy } from "@/lib/copy";
import { formatHeDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { JobRunner } from "@/components/shell/JobRunner";
import { PublicBrand } from "@/components/public/PublicBrand";
import { PublicHydrator } from "@/components/public/PublicHydrator";

function isAllowed(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    /\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name)
  );
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
  const documentSubmissions = useAppStore((state) => state.documentSubmissions);
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fileError, setFileError] = useState(false);
  const openedAt = useMemo(() => new Date(), []);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

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
          onClick={() => {
            setDone(false);
            setWorkerId(null);
            setName("");
            setIdentity("");
          }}
        >
          {copy.requestAddAnother}
        </Button>
      </div>
    );
  }

  const slots = request.requestedDocuments;
  const workerDocs = documentSubmissions.filter((doc) => doc.workerSubmissionId === workerId);

  function ensureWorker() {
    if (workerId) return workerId;
    const worker = startWorkerDraft({
      requestId: request!.id,
      submittedFullName: name.trim() || "עובד",
      submittedIdentityNumber: identity.trim() || undefined,
    });
    setWorkerId(worker.id);
    return worker.id;
  }

  function handleFile(slotId: string, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      setFileError(true);
      return;
    }
    setFileError(false);
    const id = ensureWorker();
    attachSlotFile({
      workerSubmissionId: id,
      requestedDocumentId: slotId,
      file,
    });
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        <h1 className="text-lg font-semibold">{request.title}</h1>
        <p className="mt-1 text-[14px] text-stone-500">{copy.requestExplanation(request.title)}</p>
        <p className="mt-2 text-[12.5px] text-stone-500">
          {copy.requestExpiresOn(formatHeDate(request.expiresAt.slice(0, 10)))}
        </p>
      </div>
      <div className="grid gap-3 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        <input
          className="min-h-11 rounded-full border border-[var(--line)] px-4 text-[15px]"
          placeholder={copy.formFullName}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="min-h-11 rounded-full border border-[var(--line)] px-4 text-[15px]"
          placeholder={copy.formIdentity}
          value={identity}
          onChange={(event) => setIdentity(event.target.value)}
        />
        {slots.map((slot) => {
          const doc = workerDocs.find((entry) => entry.requestedDocumentId === slot.id);
          return (
            <div key={slot.id} className="grid gap-2 rounded-[16px] border border-[var(--line)] px-4 py-3">
              <p className="text-[14px] font-medium">{slot.label}</p>
              {slot.instructions ? (
                <p className="text-[12.5px] text-stone-500">{slot.instructions}</p>
              ) : null}
              <p className="text-[12.5px] text-stone-500">
                {doc?.sourceFileId ? copy.slotAccepted : copy.slotMissing}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setActiveSlot(slot.id);
                    galleryRef.current?.click();
                  }}
                >
                  <ImageIcon className="size-4" aria-hidden />
                  {copy.gallery}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setActiveSlot(slot.id);
                    cameraRef.current?.click();
                  }}
                >
                  <Camera className="size-4" aria-hidden />
                  {copy.camera}
                </Button>
              </div>
            </div>
          );
        })}
        {fileError ? <p className="text-[13px] text-[var(--status-bad)]">{copy.requestFileError}</p> : null}
        <Button
          disabled={!name.trim()}
          onClick={() => {
            const id = ensureWorker();
            submitWorker(id);
            setDone(true);
          }}
        >
          <FileText className="size-4" aria-hidden />
          {copy.requestSubmitWorker}
        </Button>
        <p className="text-[12px] text-stone-400">{copy.requestPrivacyNote}</p>
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => activeSlot && handleFile(activeSlot, event.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => activeSlot && handleFile(activeSlot, event.target.files)}
      />
    </div>
  );
}

export default function PublicRequestPage() {
  return (
    <PublicHydrator>
      <div className="min-h-svh bg-[#FFFDFB] px-4 py-6">
        <JobRunner />
        <div className="mx-auto grid max-w-md gap-5">
          <PublicBrand />
          <RequestUpload />
        </div>
      </div>
    </PublicHydrator>
  );
}
