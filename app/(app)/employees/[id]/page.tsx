"use client";

import { useParams } from "next/navigation";
import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { EmployeesScreen } from "@/components/employees/EmployeesScreen";

export default function EmployeePage() {
  const params = useParams<{ id: string }>();

  return (
    <>
      {/* Mobile: full-page details with a back link. */}
      <div className="mx-auto w-full max-w-xl px-4 py-3 lg:hidden">
        <EmployeeDetails employeeId={params.id} showBack />
      </div>
      {/* Desktop: the same persistent split view, preselected. */}
      <div className="hidden lg:block">
        <EmployeesScreen initialSelectedId={params.id} />
      </div>
    </>
  );
}
