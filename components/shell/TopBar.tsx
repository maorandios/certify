"use client";

import { AppBrand } from "./AppBrand";
import { SettingsEntry } from "./SettingsEntry";

export function TopBar() {
  return (
    <header
      className="sticky top-0 z-30 bg-[var(--surface-muted)] lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center justify-between px-5">
        <h1 className="m-0">
          <AppBrand />
        </h1>
        <SettingsEntry />
      </div>
    </header>
  );
}
