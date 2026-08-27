"use client";

import { AppBrand } from "./AppBrand";
import { SettingsEntry } from "./SettingsEntry";

export function TopBar() {
  return (
    <header className="shrink-0 bg-[#FEF6F2] pt-[env(safe-area-inset-top)] lg:hidden">
      <div className="flex h-14 items-center justify-between px-5">
        <h1 className="m-0">
          <AppBrand />
        </h1>
        <SettingsEntry />
      </div>
    </header>
  );
}
