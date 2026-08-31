"use client";

import { X } from "lucide-react";
import { copy } from "@/lib/copy";
import type { SourceFile } from "@/lib/types";
import { SourceFilePreview } from "./SourceFilePreview";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useIsDesktop } from "@/components/ui/use-is-desktop";

type DocumentViewerProps = {
  document?: { title?: string } | null;
  sourceFile?: SourceFile | null;
  onClose: () => void;
};

export function DocumentViewer({
  document,
  sourceFile,
  onClose,
}: DocumentViewerProps) {
  const isDesktop = useIsDesktop();
  const open = Boolean(sourceFile);
  const title = document?.title ?? sourceFile?.fileMeta.name ?? copy.viewerOriginalSection;

  const body = sourceFile ? (
    <div className="grid gap-4 px-1 py-2">
      <SourceFilePreview file={sourceFile} size="md" className="w-full" />
      <dl className="grid gap-2 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">{copy.viewerFileName}</dt>
          <dd className="font-medium">{sourceFile.fileMeta.name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">{copy.viewerFileType}</dt>
          <dd className="font-medium">{sourceFile.fileMeta.mime}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">{copy.viewerFileSize}</dt>
          <dd className="font-medium">{sourceFile.fileMeta.sizeLabel}</dd>
        </div>
      </dl>
    </div>
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()} title={title}>
        {body}
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()} title={title}>
      {body}
      <Button variant="secondary" className="mt-3" onClick={onClose}>
        <X className="size-4" aria-hidden />
        {copy.viewerClose}
      </Button>
    </Drawer>
  );
}
