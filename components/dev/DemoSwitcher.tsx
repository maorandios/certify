"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import { publicRequestUrl, publicShareUrl } from "@/lib/links";
import { useAppStore, type DemoForcedState } from "@/lib/store";
import type { ActivityActionKind, MockUploadOutcome } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

const OUTCOMES: Record<MockUploadOutcome, string> = {
  certain_match: "שיוך ודאי",
  employee_not_found: "עובד לא נמצא",
  ambiguous_employee: "כמה עובדים מתאימים",
  uncertain_field: "שדה לא ודאי",
  unreadable_file: "קובץ לא קריא",
  exact_duplicate: "כפילות מדויקת",
  possible_duplicate: "כפילות אפשרית",
  certain_replacement: "החלפה ודאית",
  uncertain_replacement: "החלפה לא ודאית",
};

const ACTIONS: Record<ActivityActionKind, string> = {
  select_employee: "בחירת עובד",
  create_employee: "יצירת עובד",
  confirm_field: "אישור שדה",
  replace_file: "קובץ חלופי",
  confirm_replacement: "החלטת החלפה",
  renew_document: "בקשת חידוש",
  view_result: "צפייה בתוצאה",
};

const FORCED: Array<{ value: DemoForcedState; label: string }> = [
  { value: null, label: "רגיל" },
  { value: "loading", label: "טעינה" },
  { value: "empty", label: "ריק" },
  { value: "error", label: "שגיאה" },
];

export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const nextOutcome = useAppStore((state) => state.nextOutcome);
  const setNextOutcome = useAppStore((state) => state.setNextOutcome);
  const demoForce = useAppStore((state) => state.demoForce);
  const setDemoForce = useAppStore((state) => state.setDemoForce);
  const jobsPaused = useAppStore((state) => state.jobsPaused);
  const setJobsPaused = useAppStore((state) => state.setJobsPaused);
  const completeActiveJobs = useAppStore((state) => state.completeActiveJobs);
  const resetMockData = useAppStore((state) => state.resetMockData);
  const addDemoDocument = useAppStore((state) => state.addDemoDocument);
  const triggerDemoAction = useAppStore((state) => state.triggerDemoAction);
  const createDemoShare = useAppStore((state) => state.createDemoShare);
  const createDemoRequest = useAppStore((state) => state.createDemoRequest);

  // Never ships: excluded from production bundles entirely.
  if (process.env.NODE_ENV === "production") return null;

  const chip =
    "min-h-9 rounded-full border px-3 text-[12.5px] font-medium transition-colors";

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

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={copy.demoTitle}
        contentClassName="max-h-[70svh]"
      >
        <div className="grid gap-5 pb-2">
          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">
              {copy.demoNextOutcome}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(OUTCOMES) as MockUploadOutcome[]).map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  onClick={() => setNextOutcome(outcome)}
                  className={cn(
                    chip,
                    nextOutcome === outcome
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft,#FFEDE0)] text-[var(--color-brand)]"
                      : "border-stone-200 bg-white text-stone-600",
                  )}
                >
                  {OUTCOMES[outcome]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">
              {copy.demoTriggerAction}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(ACTIONS) as ActivityActionKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    triggerDemoAction(kind);
                    toast("נוצר אירוע בפיד");
                    setOpen(false);
                  }}
                  className={cn(chip, "border-stone-200 bg-white text-stone-600")}
                >
                  {ACTIONS[kind]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-stone-500">
              {copy.demoForceState}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FORCED.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setDemoForce(option.value)}
                  className={cn(
                    chip,
                    demoForce === option.value
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft,#FFEDE0)] text-[var(--color-brand)]"
                      : "border-stone-200 bg-white text-stone-600",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  addDemoDocument("expiring");
                  toast("נוסף מסמך לקראת פקיעה");
                }}
              >
                {copy.demoAddExpiring}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  addDemoDocument("expired");
                  toast("נוסף מסמך פג תוקף");
                }}
              >
                {copy.demoAddExpired}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  const share = createDemoShare();
                  navigator.clipboard
                    ?.writeText(publicShareUrl(share.token))
                    .catch(() => undefined);
                  toast(`קישור שיתוף נוצר והועתק: /s/${share.token}`);
                }}
              >
                {copy.demoShareToken}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  const request = createDemoRequest();
                  if (!request) {
                    toast("אין מסמך פג תוקף ליצירת בקשה");
                    return;
                  }
                  navigator.clipboard
                    ?.writeText(publicRequestUrl(request.token))
                    .catch(() => undefined);
                  toast(`בקשת מסמך נוצרה והועתקה: /r/${request.token}`);
                }}
              >
                {copy.demoRequestToken}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => setJobsPaused(!jobsPaused)}
              >
                {jobsPaused ? copy.demoResumeJobs : copy.demoPauseJobs}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                onClick={() => {
                  completeActiveJobs();
                  toast("העיבודים הושלמו");
                }}
              >
                {copy.demoCompleteJobs}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="min-h-11 text-sm text-[var(--status-bad,#DC2626)]"
              onClick={() => {
                resetMockData();
                setOpen(false);
              }}
            >
              {copy.demoReset}
            </Button>
          </section>
        </div>
      </Drawer>
    </>
  );
}
