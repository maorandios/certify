"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { useAppStore, type DemoForcedState } from "@/lib/store";
import type { DemoScenarioId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useMounted } from "@/components/ui/use-mounted";

const SCENARIOS: { id: DemoScenarioId; label: string }[] = [
  { id: "certain_match", label: "התאמה לסלוט" },
  { id: "unreadable_file", label: "קובץ לא קריא" },
  { id: "wrong_slot", label: "סלוט שגוי" },
  { id: "slot_uncertain", label: "התאמה לא ודאית" },
  { id: "missing_expiry", label: "תוקף לא ידוע" },
  { id: "name_conflict", label: "סתירת שם" },
  { id: "identity_conflict", label: "סתירת זהות" },
  { id: "field_uncertain", label: "שדה לא ודאי" },
  { id: "expired_doc", label: "מסמך פג" },
  { id: "unknown", label: "לא מוכר" },
];

const FORCED: Array<{ value: DemoForcedState; label: string }> = [
  { value: null, label: "רגיל" },
  { value: "loading", label: "טעינה" },
  { value: "empty", label: "ריק" },
  { value: "error", label: "שגיאה" },
];

export function DemoSwitcher() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const nextOutcome = useAppStore((state) => state.nextOutcome);
  const setNextOutcome = useAppStore((state) => state.setNextOutcome);
  const demoForce = useAppStore((state) => state.demoForce);
  const setDemoForce = useAppStore((state) => state.setDemoForce);
  const jobsPaused = useAppStore((state) => state.jobsPaused);
  const setJobsPaused = useAppStore((state) => state.setJobsPaused);
  const completeActiveJobs = useAppStore((state) => state.completeActiveJobs);
  const resetMockData = useAppStore((state) => state.resetMockData);
  const loadEdgeCaseQaDataset = useAppStore((state) => state.loadEdgeCaseQaDataset);
  const resetEdgeCaseQaDataset = useAppStore((state) => state.resetEdgeCaseQaDataset);
  const restoreRegularDemoSeed = useAppStore((state) => state.restoreRegularDemoSeed);

  if (process.env.NODE_ENV === "production" || !mounted) return null;

  const chip = "min-h-9 rounded-full border px-3 text-[12.5px] font-medium transition-colors";

  return (
    <>
      <button
        type="button"
        aria-label={copy.demoTitle}
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.75rem)] left-3 z-50 flex size-10 items-center justify-center rounded-full bg-[#2B2B2B] text-white shadow-lg lg:bottom-6"
      >
        <FlaskConical className="size-4.5" aria-hidden />
      </button>
      <Drawer open={open} onOpenChange={setOpen} title={copy.demoTitle}>
        <div className="grid gap-5 px-1 py-2">
          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">{copy.demoQaSection}</h3>
            <div className="mt-2 grid gap-2">
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  loadEdgeCaseQaDataset();
                  toast(copy.demoQaLoaded);
                  setOpen(false);
                }}
              >
                {copy.demoQaLoad}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  resetEdgeCaseQaDataset();
                  toast(copy.demoQaResetDone);
                  setOpen(false);
                }}
              >
                {copy.demoQaReset}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  restoreRegularDemoSeed();
                  toast(copy.demoQaRestored);
                  setOpen(false);
                }}
              >
                {copy.demoQaRestore}
              </Button>
            </div>
          </section>
          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">{copy.demoNextOutcome}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  className={cn(
                    chip,
                    nextOutcome === scenario.id
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--line)] bg-white",
                  )}
                  onClick={() => setNextOutcome(scenario.id)}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">{copy.demoForceState}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORCED.map((entry) => (
                <button
                  key={String(entry.value)}
                  type="button"
                  className={cn(
                    chip,
                    demoForce === entry.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                      : "border-[var(--line)] bg-white",
                  )}
                  onClick={() => setDemoForce(entry.value)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </section>
          <div className="grid gap-2">
            <Button variant="secondary" onClick={() => setJobsPaused(!jobsPaused)}>
              {jobsPaused ? copy.demoResumeJobs : copy.demoPauseJobs}
            </Button>
            <Button variant="secondary" onClick={() => completeActiveJobs()}>
              {copy.demoCompleteJobs}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                resetMockData();
                toast(copy.demoResetDone);
              }}
            >
              {copy.demoReset}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
