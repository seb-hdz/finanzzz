"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DbLoadingScreen } from "@/components/db-loading-screen";
import { seedDatabase } from "@/lib/db";

export function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return <DbLoadingScreen />;
  }

  return <>{children}</>;
}
