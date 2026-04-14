"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DriftingMeshBackground } from "@/components/decorative/drifting-mesh-background";
import { shouldShowMainDriftMesh } from "@/lib/main-drift-mesh-routes";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { MainContentEnter } from "./main-content-enter";
import { OfflineInfoModal } from "@/components/modals/offline-info-modal";
import { ReportProblemModalProvider } from "@/components/modals/report-problem-modal";
import { StandaloneInfoModal } from "@/components/modals/standalone-info-modal";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainDriftMesh = shouldShowMainDriftMesh(pathname);

  return (
    <ReportProblemModalProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main
          className={
            mainDriftMesh
              ? "relative isolate min-w-0 flex-1 bg-background pb-[calc(3.5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] md:pb-0"
              : "min-w-0 flex-1 pb-[calc(3.5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] md:pb-0"
          }
        >
          {mainDriftMesh ? <DriftingMeshBackground className="z-0" /> : null}
          <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <MainContentEnter>{children}</MainContentEnter>
          </div>
        </main>
        <MobileNav />
        <StandaloneInfoModal />
        <OfflineInfoModal />
      </div>
    </ReportProblemModalProvider>
  );
}
