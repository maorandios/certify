"use client";

import { useParams } from "next/navigation";
import { copy } from "@/lib/copy";
import { useAppStore } from "@/lib/store";
import { EmployeeIdentityCard } from "@/components/home/EmployeeIdentityCard";

export default function EmployeePage() {
  const params = useParams<{ id: string }>();
  const employee = useAppStore((state) =>
    state.employees.find((entry) => entry.id === params.id),
  );

  if (!employee) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8 lg:max-w-3xl lg:px-0">
        <p className="text-sm text-stone-500">{copy.employeeNotFound}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 lg:max-w-3xl lg:px-0">
      <div className="rounded-3xl border border-stone-200/80 bg-white px-5 py-6">
        <EmployeeIdentityCard employee={employee} />
      </div>
    </div>
  );
}
