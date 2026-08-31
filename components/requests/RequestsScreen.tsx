"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CircleAlert, FilePlus2, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { requestListBadge, requestWorkerCounts } from "@/lib/requests/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import { RequestDetails } from "./RequestDetails";

function matches(request: DocumentRequest, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    request.title.toLowerCase().includes(needle) ||
    request.recipient.name.toLowerCase().includes(needle)
  );
}

type RequestsScreenProps = {
  initialSelectedId?: string;
};

export function RequestsScreen({ initialSelectedId }: RequestsScreenProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const requests = useAppStore((state) => state.requests);
  const workers = useAppStore((state) => state.workerSubmissions);
  const documents = useAppStore((state) => state.documentSubmissions);
  const cases = useAppStore((state) => state.cases);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const hydrated = useAppStore((state) => state.hasHydrated);
  const demoForce = useAppStore((state) => state.demoForce);
  const setDemoForce = useAppStore((state) => state.setDemoForce);
  const openRequestCreate = useAppStore((state) => state.openRequestCreate);

  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(initialSelectedId ?? null);
  const now = useMemo(() => new Date(seedAnchor || 0), [seedAnchor]);
  const roster = useMemo(
    () => (demoForce === "empty" ? [] : requests),
    [demoForce, requests],
  );
  const filtered = useMemo(
    () => roster.filter((request) => matches(request, query)),
    [roster, query],
  );
  const loading = !hydrated || demoForce === "loading";

  function handleRowPress(request: DocumentRequest) {
    if (isDesktop) {
      setDetailId(request.id);
      return;
    }
    router.push(`/requests/${request.id}`);
  }

  const list = (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-xl font-semibold">{copy.requestsTitle}</h2>
        <Button className="min-h-11 px-3.5 text-sm" onClick={openRequestCreate}>
          <FilePlus2 className="size-4" aria-hidden />
          {copy.newRequest}
        </Button>
      </div>
      <label className="relative block">
        <Search
          className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="search"
          className="min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 pe-11 text-[15px] outline-none placeholder:text-stone-400 focus:border-[var(--color-brand)]"
          placeholder={copy.requestsSearchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {demoForce === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <CircleAlert className="size-8 text-[var(--status-bad,#DC2626)]" aria-hidden />
          <p className="text-[15px] font-semibold">משהו השתבש בטעינת הרשימה</p>
          <Button variant="secondary" onClick={() => setDemoForce(null)}>
            נסו שוב
          </Button>
        </div>
      ) : loading ? (
        <ul className="grid gap-2" aria-label="טוען">
          {Array.from({ length: 6 }).map((_, index) => (
            <li
              key={index}
              className="flex min-h-[72px] animate-pulse items-center gap-3 rounded-[20px] bg-white px-4 py-3"
            >
              <span className="size-11 shrink-0 rounded-full bg-stone-100" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="h-3.5 w-32 rounded bg-stone-100" />
                <span className="h-3 w-44 rounded bg-stone-100" />
              </span>
            </li>
          ))}
        </ul>
      ) : roster.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <Inbox className="size-9 text-stone-300" aria-hidden />
          <p className="text-[15px] font-semibold">{copy.requestsEmptyTitle}</p>
          <p className="max-w-xs text-[13.5px] text-stone-500">{copy.requestsEmptyBody}</p>
          <Button onClick={openRequestCreate}>
            <FilePlus2 className="size-4" aria-hidden />
            {copy.newRequest}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <Search className="size-7 text-stone-300" aria-hidden />
          <p className="text-[15px] font-semibold">{copy.requestsNoResultsTitle}</p>
          <p className="text-[13.5px] text-stone-500">{copy.requestsNoResultsBody(query)}</p>
        </div>
      ) : (
        <ul className="grid gap-2 pb-2">
          {filtered.map((request) => {
            const badge = requestListBadge(request, now);
            const counts = requestWorkerCounts(request.id, workers, documents, cases);
            const active = isDesktop && detailId === request.id;
            return (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => handleRowPress(request)}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-start shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition-colors active:bg-stone-50",
                    active && "ring-2 ring-[var(--color-brand)]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15.5px] font-semibold">{request.title}</span>
                      <StatusBadge status={badge} compact className="shrink-0" />
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-stone-500">
                      {request.recipient.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] font-medium text-stone-600">
                      {copy.workersSubmitted(counts.submitted)}
                    </span>
                  </span>
                  <ChevronLeft className="size-4 shrink-0 text-stone-400" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-3 lg:max-w-6xl lg:px-6 lg:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(340px,2fr)_3fr] lg:items-start lg:gap-8">
        <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pe-1">{list}</div>
        <div className="hidden lg:block">
          {detailId ? (
            <RequestDetails key={detailId} requestId={detailId} />
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-stone-200 text-[14px] text-stone-400">
              {copy.pickRequestForDetails}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
