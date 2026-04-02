"use client";

import { useEffect } from "react";

const BASE_PATH = process.env.NODE_ENV === "production" ? "/finanzzz" : "";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
        .catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
