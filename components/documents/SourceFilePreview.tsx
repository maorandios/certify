"use client";

import { FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SourceFile } from "@/lib/types";

type SourceFilePreviewProps = {
  file: SourceFile;
  size?: "sm" | "md";
  className?: string;
};

export function SourceFilePreview({
  file,
  size = "sm",
  className,
}: SourceFilePreviewProps) {
  const compact = size === "sm";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white",
        compact ? "size-11" : "aspect-[3/4] w-28",
        className,
      )}
      aria-hidden
    >
      {file.fileMeta.previewKind === "pdf" ? (
        <div className={cn("flex w-full flex-col gap-0.5 px-1.5", !compact && "gap-1.5 px-3")}>
          <div className="mx-auto h-1 w-1/2 rounded bg-stone-300" />
          {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
            <div
              key={index}
              className="h-1 rounded bg-stone-200"
              style={{ width: `${90 - index * 10}%` }}
            />
          ))}
          <FileText className={cn("self-end text-stone-300", compact ? "size-3" : "size-6")} />
        </div>
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
          <ImageIcon className={cn("text-stone-400", compact ? "size-4" : "size-8")} />
        </div>
      )}
    </div>
  );
}
