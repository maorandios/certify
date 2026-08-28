"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  CircleAlert,
  Search,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import {
  employeeStatusDetailHe,
  getEmployeeDocumentStatus,
} from "@/lib/status";
import { useAppStore } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useIsDesktop } from "@/components/ui/use-is-desktop";
import { ShareSheet } from "@/components/share/ShareSheet";
import { EmployeeDetails } from "./EmployeeDetails";
import { EmployeeFormSheet } from "./EmployeeFormSheet";

function matches(employee: Employee, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    employee.fullName.toLowerCase().includes(needle) ||
    employee.identityNumber.includes(needle) ||
    (employee.description ?? "").toLowerCase().includes(needle)
  );
}

type EmployeesScreenProps = {
  /** Preselects an employee in the desktop split view. */
  initialSelectedId?: string;
};

export function EmployeesScreen({ initialSelectedId }: EmployeesScreenProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const employees = useAppStore((state) => state.employees);
  const documents = useAppStore((state) => state.documents);
  const seedAnchor = useAppStore((state) => state.seedAnchor);
  const hydrated = useAppStore((state) => state.ui.hydrated);
  const demoForce = useAppStore((state) => state.demoForce);
  const setDemoForce = useAppStore((state) => state.setDemoForce);

  const [query, setQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const now = useMemo(() => new Date(seedAnchor), [seedAnchor]);
  const roster = useMemo(
    () => (demoForce === "empty" ? [] : employees),
    [demoForce, employees],
  );
  const filtered = useMemo(
    () =>
      roster
        .filter((employee) => matches(employee, query))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "he")),
    [roster, query],
  );

  const loading = !hydrated || demoForce === "loading";

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function handleRowPress(employee: Employee) {
    if (selectionMode) {
      toggleSelection(employee.id);
      return;
    }
    if (isDesktop) {
      setDetailId(employee.id);
      return;
    }
    router.push(`/employees/${employee.id}`);
  }

  const list = (
    <div className="flex min-h-0 flex-col gap-3">
      {/* Title + actions */}
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-xl font-semibold">{copy.employeesTitle}</h2>
        <div className="flex items-center gap-1">
          {selectionMode ? (
            <Button
              variant="ghost"
              className="min-h-11 px-3 text-sm text-stone-500"
              onClick={exitSelection}
            >
              <X className="size-4" aria-hidden />
              {copy.cancelSelection}
            </Button>
          ) : (
            <>
              {roster.length > 1 ? (
                <Button
                  variant="ghost"
                  className="min-h-11 px-3 text-sm"
                  onClick={() => setSelectionMode(true)}
                >
                  {copy.selectMode}
                </Button>
              ) : null}
              <Button
                className="min-h-11 px-3.5 text-sm"
                onClick={() => setCreateOpen(true)}
              >
                <UserRoundPlus className="size-4" aria-hidden />
                {copy.newEmployee}
              </Button>
            </>
          )}
        </div>
      </div>

      {selectionMode ? (
        <p className="px-1 text-[13px] text-stone-500">
          {copy.selectEmployeesHint}
        </p>
      ) : null}

      {/* Search */}
      <label className="relative block">
        <Search
          className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="search"
          className="min-h-11 w-full rounded-full border border-[var(--line)] bg-white px-4 pe-11 text-[15px] outline-none placeholder:text-stone-400 focus:border-[var(--color-brand)]"
          placeholder={copy.employeesSearchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {/* States */}
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
          <UsersRound className="size-9 text-stone-300" aria-hidden />
          <p className="text-[15px] font-semibold">{copy.employeesEmptyTitle}</p>
          <p className="max-w-xs text-[13.5px] text-stone-500">
            {copy.employeesEmptyBody}
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <UserRoundPlus className="size-4" aria-hidden />
            {copy.newEmployee}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
          <Search className="size-7 text-stone-300" aria-hidden />
          <p className="text-[15px] font-semibold">
            {copy.employeesNoResultsTitle}
          </p>
          <p className="text-[13.5px] text-stone-500">
            {copy.employeesNoResultsBody(query)}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 pb-2">
          {filtered.map((employee) => {
            const status = getEmployeeDocumentStatus(employee, documents, now);
            const selected = selectedIds.has(employee.id);
            const active = !selectionMode && isDesktop && detailId === employee.id;
            return (
              <li key={employee.id}>
                <button
                  type="button"
                  onClick={() => handleRowPress(employee)}
                  aria-pressed={selectionMode ? selected : undefined}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-start shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition-colors active:bg-stone-50",
                    active && "ring-2 ring-[var(--color-brand)]",
                    selectionMode && selected &&
                      "ring-2 ring-[var(--color-brand)] bg-[var(--color-brand-soft,#FFEDE0)]/40",
                  )}
                >
                  {selectionMode ? (
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        selected
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : "border-stone-300 bg-white",
                      )}
                      aria-hidden
                    >
                      {selected ? <Check className="size-3.5" /> : null}
                    </span>
                  ) : null}
                  <Avatar
                    name={employee.fullName}
                    src={employee.profileImage}
                    size="md"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15.5px] font-semibold">
                        {employee.fullName}
                      </span>
                      <StatusBadge status={status} compact className="shrink-0" />
                    </span>
                    {employee.description ? (
                      <span className="mt-0.5 block truncate text-[12.5px] text-stone-500">
                        {employee.description}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-[12.5px] font-medium text-stone-600">
                      {employeeStatusDetailHe(employee, documents, now)}
                    </span>
                  </span>
                  {!selectionMode ? (
                    <ChevronLeft
                      className="size-4 shrink-0 text-stone-400"
                      aria-hidden
                    />
                  ) : null}
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
      {/* Desktop: persistent RTL split view. Mobile: list only. */}
      <div className="lg:grid lg:grid-cols-[minmax(340px,2fr)_3fr] lg:items-start lg:gap-8">
        <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pe-1">
          {list}
        </div>
        <div className="hidden lg:block">
          {detailId ? (
            <EmployeeDetails key={detailId} employeeId={detailId} />
          ) : (
            <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-stone-200 text-[14px] text-stone-400">
              {copy.pickEmployeeForDetails}
            </div>
          )}
        </div>
      </div>

      {/* Selection-mode bottom bar */}
      {selectionMode && selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6">
          <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[#2B2B2B] py-2 pe-2 ps-5 text-white shadow-lg">
            <span className="text-[13.5px] font-medium">
              {copy.selectedCount(selectedIds.size)}
            </span>
            <Button
              className="min-h-10 px-4 text-sm"
              onClick={() => setShareOpen(true)}
            >
              {copy.continueToShare}
            </Button>
          </div>
        </div>
      ) : null}

      <EmployeeFormSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        onSaved={(employee) => {
          if (isDesktop) setDetailId(employee.id);
          else router.push(`/employees/${employee.id}`);
        }}
      />
      <ShareSheet
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          exitSelection();
        }}
        employeeIds={[...selectedIds]}
      />
    </div>
  );
}
