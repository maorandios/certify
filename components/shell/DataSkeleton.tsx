import { copy } from "@/lib/copy";

export function DataSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6 lg:max-w-3xl lg:px-0"
      aria-busy="true"
      aria-label={copy.loadingPersisted}
    >
      <div className="h-24 animate-pulse rounded-[28px] bg-stone-100" />
      <div className="grid gap-3">
        <div className="h-28 animate-pulse rounded-[24px] bg-stone-100" />
        <div className="h-28 animate-pulse rounded-[24px] bg-stone-100" />
        <div className="h-20 animate-pulse rounded-[24px] bg-stone-100" />
      </div>
    </div>
  );
}
