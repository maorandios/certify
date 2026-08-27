"use client";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { copy } from "@/lib/copy";

export function SettingsEntry() {
  return (
    <Link
      href="/settings"
      aria-label={copy.settingsTitle}
      className="flex size-11 items-center justify-center text-[var(--logo-ink)]"
    >
      <CircleUserRound className="size-5" />
    </Link>
  );
}
