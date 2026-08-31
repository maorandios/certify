"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Ban, Camera, CheckCircle2, ImageIcon, LinkIcon, TimerOff } from "lucide-react";
import { copy } from "@/lib/copy";
import { isReuploadLinkOpen } from "@/lib/requests/transitions";
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

function ReuploadBody() {
  const params = useParams<{ token: string }>();
  const links = useAppStore((state) => state.reuploadLinks);
  const requests = useAppStore((state) => state.requests);
  const workers = useAppStore((state) => state.workerSubmissions);
  const submitReupload = useAppStore((state) => state.submitReupload);
  const [done, setDone] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const now = useMemo(() => new Date(), []);
  const link = links.find((entry) => entry.token === params.token);
  const request = requests.find((entry) => entry.id === link?.requestId);
  const worker = workers.find((entry) => entry.id === link?.workerSubmissionId);
  const slot = request?.requestedDocuments.find((entry) => entry.id === link?.requestedDocumentId);

  if (!link || !request || !worker || !slot) {
    return (
      <Note
        icon={<LinkIcon className="size-8 text-stone-300" aria-hidden />}
        title={copy.requestInvalidTitle}
        body={copy.requestExpiredBody}
      />
    );
  }

  if (link.resolvedAt) {
    return (
      <Note
        icon={<CheckCircle2 className="size-10 text-[var(--status-ok,#15803D)]" aria-hidden />}
        title={copy.reuploadResolvedTitle}
        body={copy.reuploadResolvedBody}
      />
    );
  }

  if (!isReuploadLinkOpen(link, request, now)) {
    const expired = request.status === "expired" || new Date(link.expiresAt).getTime() <= now.getTime();
    return (
      <Note
        icon={
          expired ? (
            <TimerOff className="size-8 text-stone-300" aria-hidden />
          ) : (
            <Ban className="size-8 text-stone-300" aria-hidden />
          )
        }
        title={expired ? copy.requestExpiredTitle : copy.requestCancelledTitle}
        body={expired ? copy.requestExpiredBody : copy.requestCancelledBody}
      />
    );
  }

  if (done) {
    return (
      <Note
        icon={<CheckCircle2 className="size-10 text-[var(--status-ok,#15803D)]" aria-hidden />}
        title={copy.requestSuccessTitle}
        body={copy.requestSuccessBody}
      />
    );
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !isAllowed(file) || !link) return;
    submitReupload(link.token, file);
    setDone(true);
  }

  return (
    <div className="grid gap-4 rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
      <h1 className="text-lg font-semibold">{copy.reuploadTitle}</h1>
      <p className="text-[14px] font-medium">{worker.submittedFullName}</p>
      <p className="text-[14px] text-stone-600">{slot.label}</p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => galleryRef.current?.click()}>
          <ImageIcon className="size-4" aria-hidden />
          {copy.gallery}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => galleryRef.current?.click()}>
          <Camera className="size-4" aria-hidden />
          {copy.camera}
        </Button>
      </div>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}

export default function PublicReuploadPage() {
  return (
    <PublicHydrator>
      <div className="min-h-svh bg-[#FFFDFB] px-4 py-6">
        <JobRunner />
        <div className="mx-auto grid max-w-md gap-5">
          <PublicBrand />
          <ReuploadBody />
        </div>
      </div>
    </PublicHydrator>
  );
}
