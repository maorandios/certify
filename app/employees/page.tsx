"use client";

import { Users } from "lucide-react";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";

export default function EmployeesPlaceholderPage() {
  const count = useAppStore((state) => state.employees.length);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 px-4 py-8 lg:max-w-3xl lg:px-0">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Users className="size-6" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{copy.employeesPlaceholderTitle}</h2>
        <p className="mt-2 max-w-md text-stone-500">
          {copy.employeesPlaceholderBody}
        </p>
        <p className="mt-4 text-sm text-stone-400">{count} עובדים בתיק המקומי</p>
      </div>
    </div>
  );
}
