"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, eventStatusLabels } from "@/lib/copy";
import type { EventListStatus } from "@/lib/requests/types";

export type EventFilter = "all" | EventListStatus;

const FILTERS: { id: EventFilter; label: string }[] = [
  { id: "all", label: copy.eventFilterAll },
  { id: "open", label: eventStatusLabels.open },
  { id: "in_progress", label: eventStatusLabels.in_progress },
  { id: "completed", label: eventStatusLabels.completed },
  { id: "cancelled", label: eventStatusLabels.cancelled },
];

const statusDot: Record<EventListStatus, string> = {
  open: "bg-[#FF5900] shadow-[0_0_6px_#FF5900]",
  in_progress: "bg-[#0004FF] shadow-[0_0_6px_#0004FF]",
  completed: "bg-[#00FF62] shadow-[0_0_6px_#00FF62]",
  cancelled: "bg-[#2B2B2B] shadow-[0_0_6px_rgba(43,43,43,0.55)]",
};

const SLIDE = { type: "tween" as const, duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

type EventFilterDropdownProps = {
  value: EventFilter;
  onChange: (value: EventFilter) => void;
};

export function EventFilterDropdown({ value, onChange }: EventFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = FILTERS.find((entry) => entry.id === value) ?? FILTERS[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 basis-0 flex-[3]">
      <button
        type="button"
        aria-label={copy.eventFilterAria}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-11 w-full items-center gap-1.5 rounded-full border bg-white px-3 text-start text-[13.5px] font-medium text-[#2B2B2B] outline-none transition-colors",
          open ? "border-[#2B2B2B]" : "border-[var(--line)] focus:border-[var(--color-brand)]",
        )}
      >
        {value !== "all" ? (
          <span className={cn("size-1.5 shrink-0 rounded-full", statusDot[value])} aria-hidden />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-stone-400 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            id={menuId}
            role="listbox"
            aria-label={copy.eventFilterAria}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SLIDE}
            className="absolute end-0 top-[calc(100%+6px)] z-30 min-w-[11.5rem] origin-top overflow-hidden rounded-[20px] bg-[#FFFDFB] p-1.5 shadow-[0_8px_28px_rgba(43,43,43,0.16)] ring-1 ring-[#2B2B2B]/10"
          >
            {FILTERS.map((entry) => {
              const isSelected = entry.id === value;
              return (
                <li key={entry.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(entry.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex min-h-10 w-full items-center gap-2 rounded-full px-3 text-[13.5px] font-medium transition-colors",
                      isSelected
                        ? "bg-[#2B2B2B] text-[#FFFDFB]"
                        : "text-[#2B2B2B] hover:bg-stone-100",
                    )}
                  >
                    {entry.id === "all" ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-stone-300" aria-hidden />
                    ) : (
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", statusDot[entry.id])}
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-start">{entry.label}</span>
                    {isSelected ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
