"use client";

import Link from "next/link";
import { ChevronLeft, IdCard, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { Employee } from "@/lib/types";

type EmployeeIdentityCardProps = {
  employee: Employee;
  showOpenPage?: boolean;
  onOpenPage?: () => void;
};

export function EmployeeIdentityCard({
  employee,
  showOpenPage = false,
  onOpenPage,
}: EmployeeIdentityCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <Avatar
        name={employee.fullName}
        src={employee.profileImage}
        size="xl"
      />
      <h3 className="mt-3 text-lg font-semibold leading-6">
        {employee.fullName}
      </h3>
      <dl className="mt-4 w-full space-y-2.5 text-start text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-stone-500">
            <IdCard className="size-3.5 shrink-0" aria-hidden />
            {copy.identityNumberLabel}
          </dt>
          <dd className="font-medium tabular-nums" dir="ltr">
            {employee.identityNumber}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-stone-500">
            <Phone className="size-3.5 shrink-0" aria-hidden />
            {copy.phoneLabel}
          </dt>
          <dd className="font-medium tabular-nums" dir="ltr">
            {employee.phone ? (
              <a
                href={`tel:${employee.phone}`}
                className="text-[var(--color-brand)]"
              >
                {employee.phone}
              </a>
            ) : (
              <span className="text-stone-400">{copy.phoneMissing}</span>
            )}
          </dd>
        </div>
      </dl>
      {showOpenPage ? (
        <Link
          href={`/employees/${employee.id}`}
          onClick={onOpenPage}
          className={cn(buttonVariants({ variant: "primary" }), "mt-5 w-full")}
        >
          {copy.openEmployeePage}
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
