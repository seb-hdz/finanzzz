"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MainContentEnter } from "./main-content-enter";
import { StandaloneInfoModal } from "@/components/standalone-info-modal";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <MainContentEnter>{children}</MainContentEnter>
        </div>
      </main>
      <MobileNav />
      <StandaloneInfoModal />
    </div>
  );
}
