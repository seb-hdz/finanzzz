"use client";

import { useSyncExternalStore } from "react";

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as unknown as { standalone?: boolean }).standalone === true)
    return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(display-mode: standalone)");
  const handler = () => onStoreChange();
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, getIsStandalone, () => false);
}
