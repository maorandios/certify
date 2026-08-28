"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Ban,
  Camera,
  CheckCircle2,
  CircleAlert,
  FileText,
  ImageIcon,
  LinkIcon,
  Loader2,
  ShieldCheck,
  TimerOff,
} from "lucide-react";
import { copy, documentTypeLabels } from "@/lib/copy";
import { formatHeDate } from "@/lib/dates";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { JobRunner } from "@/components/shell/JobRunner";
import { PublicBrand } from "@/components/public/PublicBrand";
import { PublicHydrator } from "@/components/public/PublicHydrator";

type Phase = "idle" | "uploading" | "processing" | "done";

function isAllowed(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    /\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name)
  );
}

function RequestUpload() {
  const params = useParams<{ token: string }>();
  const requests = useAppStore((state) => state.requests);
  const employees = useAppStore((state) => state.employees);
  const markRequestOpened = useAppStore((state) => state.markRequestOpened);
  const submitRequestUpload = useAppStore(
    (state) => state.submitRequestUpload,
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [fileError, setFileError] = useState(false);
  const openedAt = useMemo(() => new Date(), []);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const request = requests.find((entry) => entry.token === params.token);
  const employee = employees.find(
    (entry) => entry.id === request?.employeeId,
  );

  // The recipient opening the link is a tracked state on the request.
  useEffect(() => {
    if (request?.status === "created") markRequestOpened(request.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  if (!request || !employee) {
    return (
      <Note
        icon={<LinkIcon className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestInvalidTitle}
        body={copy.requestExpiredBody}
      />
    );
  }

  const expired =
    request.status === "expired" ||
    new Date(request.expiresAt + "T23:59:59").getTime() < openedAt.getTime();

  if (request.status === "cancelled") {
    return (
      <Note
        icon={<Ban className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestCancelledTitle}
        body={copy.requestCancelledBody}
      />
    );
  }

  if (phase === "done") {
    return (
      <Note
        icon={
          <CheckCircle2
            className="size-10 text-[var(--status-ok,#15803D)]"
            aria-hidden
          />
        }
        title={copy.requestSuccessTitle}
        body={copy.requestSuccessBody}
      />
    );
  }

  if (request.status === "uploaded") {
    return (
      <Note
        icon={
          <CheckCircle2
            className="size-8 text-[var(--status-ok,#15803D)]"
            aria-hidden
          />
        }
        title={copy.requestCompletedTitle}
        body={copy.requestCompletedBody}
      />
    );
  }

  if (expired) {
    return (
      <Note
        icon={<TimerOff className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestExpiredTitle}
        body={copy.requestExpiredBody}
      />
    );
  }

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      setFileError(true);
      return;
    }
    setFileError(false);
    setPhase("uploading");
    window.setTimeout(() => {
      submitRequestUpload(request!.token, file);
      setPhase("processing");
      // The mock processing job (JobRunner below) takes ~3.6s.
      window.setTimeout(() => setPhase("done"), 4200);
    }, 1200);
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-5 px-5 py-10">
      <PublicBrand subtitle={copy.publicShareBy} />

      <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
        <h1 className="text-lg font-semibold">{copy.requestPageTitle}</h1>
        <p className="mt-2 text-[14px] leading-6 text-stone-600">
          {copy.requestExplanation(copy.appName)}
        </p>
        <div className="mt-4 grid gap-1.5 rounded-2xl bg-stone-50 px-4 py-3 text-[13.5px]">
          <p className="flex justify-between gap-3">
            <span className="text-stone-500">שם העובד</span>
            <span className="font-semibold">{employee.fullName}</span>
          </p>
          {request.documentType ? (
            <p className="flex justify-between gap-3">
              <span className="text-stone-500">{copy.requestedDocLabel}</span>
              <span className="font-semibold">
                {documentTypeLabels[request.documentType]}
              </span>
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-[12px] text-stone-400">
          {copy.requestExpiresOn(formatHeDate(request.expiresAt))}
        </p>
      </div>

      {phase === "uploading" || phase === "processing" ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <Loader2
            className="size-8 animate-spin text-[var(--color-brand,#FF5900)]"
            aria-hidden
          />
          <p className="text-[14.5px] font-medium">
            {phase === "uploading"
              ? copy.requestUploading
              : copy.requestProcessingNote}
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleFile(event.target.files)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFile(event.target.files)}
          />
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => handleFile(event.target.files)}
          />
          <Button className="min-h-12" onClick={() => cameraRef.current?.click()}>
            <Camera className="size-4" aria-hidden />
            {copy.camera}
          </Button>
          <Button
            variant="secondary"
            className="min-h-12"
            onClick={() => galleryRef.current?.click()}
          >
            <ImageIcon className="size-4" aria-hidden />
            {copy.gallery}
          </Button>
          <Button
            variant="secondary"
            className="min-h-12"
            onClick={() => pdfRef.current?.click()}
          >
            <FileText className="size-4" aria-hidden />
            {copy.pdf}
          </Button>
          {fileError ? (
            <p className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[var(--status-bad,#DC2626)]">
              <CircleAlert className="size-4" aria-hidden />
              {copy.requestFileError}
            </p>
          ) : null}
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-stone-100/70 px-4 py-3 text-[12.5px] leading-5 text-stone-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {copy.requestPrivacyNote}
      </p>
    </div>
  );
}

function Note({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <PublicBrand />
      {icon}
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {body ? <p className="mt-1 text-[13.5px] text-stone-500">{body}</p> : null}
      </div>
    </div>
  );
}

export default function PublicRequestPage() {
  return (
    <div className="min-h-svh bg-[#FFFDFB]">
      <PublicHydrator>
        <RequestUpload />
        {/* Keeps the simulated processing job ticking on the public page. */}
        <JobRunner />
      </PublicHydrator>
    </div>
  );
}
