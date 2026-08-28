"use client";

import { useMemo, useState } from "react";
import { Camera, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import { copy } from "@/lib/copy";
import { useAppStore, type EmployeeInput } from "@/lib/store";
import type { ActivityItem, Employee } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";
import {
  ActivitySheetHeader,
  sheetContentClassName,
  sheetDialogClassName,
  sheetDrawerClassName,
} from "@/components/home/ActivitySheetHeader";

const PALETTE = [
  "#0F766E",
  "#B45309",
  "#1E3A5F",
  "#BE185D",
  "#365314",
  "#7C3AED",
  "#0E7490",
];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

/** Simulated image pick: renders an initials avatar as a data URI. */
function mockImage(name: string, kind: "gallery" | "camera"): string {
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const initials = initialsOf(name) || "?";
  const fill =
    kind === "camera"
      ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#2B2B2B"/></linearGradient></defs><rect width="64" height="64" rx="32" fill="url(#g)"/>`
      : `<rect width="64" height="64" rx="32" fill="${color}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${fill}<text x="32" y="40" text-anchor="middle" fill="white" font-size="22" font-family="Arial,sans-serif">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type EmployeeFormSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  employee?: Employee;
  /** Prefill from a document extraction (unmatched upload flow). */
  prefill?: Partial<EmployeeInput>;
  /** Resume this feed decision after the employee is created. */
  activityId?: string;
  /** Feed event that opened this form — drives the shared sheet header. */
  activity?: ActivityItem;
  onSaved?: (employee: Employee) => void;
};

export function EmployeeFormSheet({
  open,
  onClose,
  mode,
  employee,
  prefill,
  activityId,
  activity,
  onSaved,
}: EmployeeFormSheetProps) {
  const [held, setHeld] = useState(activity);
  if (activity && held?.id !== activity.id) {
    setHeld(activity);
  }
  const displayActivity = activity ?? held;
  const jobs = useAppStore((state) => state.jobs);
  const extractedName = displayActivity?.jobId
    ? jobs.find((job) => job.id === displayActivity.jobId)?.extracted?.fullName
    : undefined;

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={mode === "edit" ? copy.formEditTitle : copy.formCreateTitle}
      titleHidden={displayActivity != null}
      drawerClassName={sheetDrawerClassName}
      contentClassName={sheetContentClassName}
      dialogClassName={sheetDialogClassName}
      header={
        displayActivity ? (
          <ActivitySheetHeader
            item={displayActivity}
            employee={employee}
            employeeName={extractedName ?? prefill?.fullName}
          />
        ) : undefined
      }
    >
      {/* The body mounts fresh every time the sheet opens, resetting state. */}
      <FormBody
        mode={mode}
        employee={employee}
        prefill={prefill}
        activityId={activityId}
        onClose={onClose}
        onSaved={onSaved}
      />
    </ResponsiveSheet>
  );
}

function FormBody({
  mode,
  employee,
  prefill,
  activityId,
  onClose,
  onSaved,
}: Omit<EmployeeFormSheetProps, "open">) {
  const employees = useAppStore((state) => state.employees);
  const addEmployee = useAppStore((state) => state.addEmployee);
  const updateEmployee = useAppStore((state) => state.updateEmployee);
  const createEmployeeFromActivity = useAppStore(
    (state) => state.createEmployeeFromActivity,
  );

  const [fullName, setFullName] = useState(
    employee?.fullName ?? prefill?.fullName ?? "",
  );
  const [identityNumber, setIdentityNumber] = useState(
    employee?.identityNumber ?? prefill?.identityNumber ?? "",
  );
  const [description, setDescription] = useState(
    employee?.description ?? prefill?.description ?? "",
  );
  const [profileImage, setProfileImage] = useState<string | undefined>(
    employee?.profileImage ?? prefill?.profileImage,
  );
  const [errors, setErrors] = useState<{ name?: string; identity?: string }>(
    {},
  );
  const [saving, setSaving] = useState(false);

  const isPrefilled = useMemo(
    () => mode === "create" && Boolean(prefill?.fullName),
    [mode, prefill],
  );

  function validate(): boolean {
    const next: { name?: string; identity?: string } = {};
    const name = fullName.trim();
    const identity = identityNumber.trim();
    if (!name) next.name = copy.formRequiredName;
    if (!identity) {
      next.identity = copy.formRequiredIdentity;
    } else if (!/^\d{5,12}$/.test(identity)) {
      next.identity = copy.formInvalidIdentity;
    } else {
      const duplicate = employees.some(
        (candidate) =>
          candidate.identityNumber === identity &&
          candidate.id !== employee?.id,
      );
      if (duplicate) next.identity = copy.formDuplicateIdentity;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (saving || !validate()) return;
    setSaving(true);
    const input: EmployeeInput = {
      fullName,
      identityNumber,
      description: description || undefined,
      profileImage,
    };
    // Short simulated save so the loading state is visible.
    window.setTimeout(() => {
      let saved: Employee;
      if (mode === "edit" && employee) {
        updateEmployee(employee.id, input);
        saved = { ...employee, ...input };
      } else if (activityId) {
        saved = createEmployeeFromActivity(activityId, input);
      } else {
        saved = addEmployee(input);
      }
      onClose();
      onSaved?.(saved);
    }, 600);
  }

  const inputClass =
    "min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-[15px] outline-none focus:border-[var(--color-brand)]";

  return (
    <div className="grid gap-4 pb-1">
      {isPrefilled ? (
        <p className="flex items-start gap-2 rounded-2xl bg-[var(--color-brand-soft)] px-3 py-2.5 text-[13px] leading-5 text-[var(--color-brand)]">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          {copy.formPrefilledHint}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Avatar name={fullName || "?"} src={profileImage} size="lg" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11 px-3 text-sm"
            onClick={() => setProfileImage(mockImage(fullName, "gallery"))}
          >
            <ImageIcon className="size-4" aria-hidden />
            {copy.formFromGallery}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 px-3 text-sm"
            onClick={() => setProfileImage(mockImage(fullName, "camera"))}
          >
            <Camera className="size-4" aria-hidden />
            {copy.formTakePhoto}
          </Button>
          {profileImage ? (
            <Button
              variant="ghost"
              className="min-h-11 px-3 text-sm text-stone-500"
              onClick={() => setProfileImage(undefined)}
            >
              <Trash2 className="size-4" aria-hidden />
              {copy.formRemoveImage}
            </Button>
          ) : null}
        </div>
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{copy.formFullName}</span>
        <input
          className={inputClass}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="off"
        />
        {errors.name ? (
          <span className="text-[13px] text-[var(--status-bad,#DC2626)]">
            {errors.name}
          </span>
        ) : null}
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{copy.formIdentity}</span>
        <input
          className={inputClass}
          value={identityNumber}
          onChange={(event) => setIdentityNumber(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          style={{ textAlign: "end" }}
        />
        {errors.identity ? (
          <span className="text-[13px] text-[var(--status-bad,#DC2626)]">
            {errors.identity}
          </span>
        ) : null}
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium">{copy.formDescription}</span>
        <textarea
          className="min-h-20 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[var(--color-brand)]"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
        />
      </label>

      <div className="mt-1 flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {copy.formSaving}
            </>
          ) : (
            copy.formSave
          )}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {copy.formCancel}
        </Button>
      </div>
    </div>
  );
}
