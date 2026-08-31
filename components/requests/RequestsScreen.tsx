"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, FilePlus2, Inbox, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { eventListStatus } from "@/lib/requests/status";
import { useAppStore } from "@/lib/store";
import type { DocumentRequest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import { EventCard } from "./EventCard";
import { EventFilterDropdown, type EventFilter } from "./EventFilterDropdown";
import { RequestDetails } from "./RequestDetails";

function matches(request: DocumentRequest, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    request.title.toLowerCase().includes(needle) ||
    request.recipient.name.toLowerCase().includes(needle)
  );
}

function byCreatedDesc(left: DocumentRequest, right: DocumentRequest) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

type RequestsScreenProps = {
  initialSelectedId?: string;
};

export function RequestsScreen({ initialSelectedId }: RequestsScreenProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const requests = useAppStore((state) => state.requests);
  const workers = useAppStore((state) => state.workerSubmissions);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const hydrated = useAppStore((state) => state.hasHydrated);
  const demoForce = useAppStore((state) => state.demoForce);
  const setDemoForce = useAppStore((state) => state.setDemoForce);
  const openRequestCreate = useAppStore((state) => state.openRequestCreate);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");
  const [detailId, setDetailId] = useState<string | null>(initialSelectedId ?? null);
  const now = useMemo(() => new Date(seedAnchor || 0), [seedAnchor]);
  const roster = useMemo(
    () => (demoForce === "empty" ? [] : requests),
    [demoForce, requests],
  );
  const filtered = useMemo(
    () =>
      roster
        .filter((request) => {
          if (!matches(request, query)) return false;
          if (filter === "all") return true;
          return eventListStatus(request, workers, now) === filter;
        })
        .sort(byCreatedDesc),
    [roster, query, filter, workers, now],
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
      <div className="flex items-stretch gap-2">
        <label className="relative block min-w-0 basis-0 flex-[7]">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            type="search"
            className="min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 ps-10 text-[15px] outline-none placeholder:text-stone-400 focus:border-[var(--color-brand)]"
            placeholder={copy.requestsSearchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <EventFilterDropdown value={filter} onChange={setFilter} />
      </div>
      {demoForce === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <CircleAlert className="size-8 text-[var(--status-bad,#DC2626)]" aria-hidden />
          <p className="text-[15px] font-semibold">משהו השתבש בטעינת הרשימה</p>
          <Button variant="secondary" onClick={() => setDemoForce(null)}>
            נסו שוב
          </Button>
        </div>
      ) : loading ? (
        <ol className="m-0 list-none p-0" aria-label="טוען">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className={cn("flex gap-3", index === 5 ? "pb-1" : "pb-6")}>
              <span className="mt-0.5 size-4 shrink-0 rounded bg-stone-100" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="h-3 w-28 rounded bg-stone-100" />
                <span className="h-3.5 w-40 rounded bg-stone-100" />
                <span className="h-3 w-24 rounded bg-stone-100" />
              </span>
            </li>
          ))}
        </ol>
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
          <p className="text-[13.5px] text-stone-500">
            {query.trim() ? copy.requestsNoResultsBody(query) : copy.eventFilterEmpty}
          </p>
        </div>
      ) : (
        <ol className="m-0 list-none p-0">
          {filtered.map((request, index) => (
            <EventCard
              key={request.id}
              request={request}
              status={eventListStatus(request, workers, now)}
              now={now}
              isLast={index === filtered.length - 1}
              active={isDesktop && detailId === request.id}
              onPress={handleRowPress}
            />
          ))}
        </ol>
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
