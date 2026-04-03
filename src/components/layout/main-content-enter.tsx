"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Remounts on route change so enter animations run; stagger targets each page’s
 * top-level blocks inside the usual root `div.space-y-6` (see `.page-enter-stagger` in globals.css).
 */
export function MainContentEnter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter-stagger">
      {children}
    </div>
  );
}
