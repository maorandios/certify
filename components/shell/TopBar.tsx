"use client";

import { AppBrand } from "./AppBrand";
import { SettingsEntry } from "./SettingsEntry";

export function TopBar() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 lg:hidden">
      <div className="pointer-events-auto border-b border-[#2B2B2B]/5 bg-[#FFFDFB]/70 pt-[env(safe-area-inset-top)] backdrop-blur-[24px] backdrop-saturate-150 [-webkit-backdrop-filter:blur(24px)_saturate(1.5)]">
        <div className="flex h-14 items-center justify-between px-5">
          <h1 className="m-0">
            <AppBrand />
          </h1>
          <SettingsEntry />
        </div>
      </div>
    </header>
  );
}
