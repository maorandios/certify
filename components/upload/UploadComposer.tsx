"use client";

import { useRef } from "react";
import { Camera, FileText, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";

const ACCEPTED = "image/*,application/pdf";

function isAllowed(file: File) {
  return (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    /\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name)
  );
}

export function UploadComposer() {
  const open = useAppStore((state) => state.ui.composerOpen);
  const closeComposer = useAppStore((state) => state.closeComposer);
  const enqueueUpload = useAppStore((state) => state.enqueueUpload);
  const isDesktop = useIsDesktop();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const desktopRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!isAllowed(file)) {
      toast.error(copy.invalidFile);
      return;
    }
    enqueueUpload(file);
    toast(copy.captured);
  }

  const sources = (
    <div className="grid gap-3">
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <input
        ref={desktopRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {isDesktop ? (
        <button
          type="button"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => desktopRef.current?.click()}
          className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-stone-300 bg-stone-50 px-6 text-center"
        >
          <Upload className="size-8 text-[var(--color-brand)]" />
          <div>
            <p className="font-medium">{copy.dropHint}</p>
            <p className="mt-1 text-sm text-stone-500">{copy.pickFile}</p>
          </div>
        </button>
      ) : (
        <div className="grid gap-2">
          <SourceButton
            icon={ImageIcon}
            label={copy.gallery}
            onClick={() => galleryRef.current?.click()}
          />
          <SourceButton
            icon={Camera}
            label={copy.camera}
            onClick={() => cameraRef.current?.click()}
          />
          <SourceButton
            icon={FileText}
            label={copy.pdf}
            onClick={() => pdfRef.current?.click()}
          />
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => !next && closeComposer()}
        title={copy.composerTitle}
      >
        {sources}
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && closeComposer()}
      title={copy.composerTitle}
    >
      {sources}
    </Drawer>
  );
}

function SourceButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ImageIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant="secondary" className="h-14 justify-start gap-3" onClick={onClick}>
      <Icon className="size-5 text-[var(--color-brand)]" />
      {label}
    </Button>
  );
}
