"use client";

import { useSyncExternalStore } from "react";

export type ApplePlatformKind = "ios" | "mac";

/**
 * Detects Apple platforms via user agent / platform hints (client-only).
 * Until `ready` is true, consumers should use non–Apple-specific copy to avoid hydration mismatch.
 */
export function getApplePlatformKind(): ApplePlatformKind | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const maxTouch = navigator.maxTouchPoints ?? 0;
  const platform = navigator.platform ?? "";

  if (/iPhone|iPod/i.test(ua)) return "ios";
  if (/iPad/i.test(ua)) return "ios";
  if (platform === "MacIntel" && maxTouch > 1) return "ios";

  if (/Mac OS X/i.test(ua) || (platform === "MacIntel" && maxTouch === 0)) {
    return "mac";
  }

  return null;
}

type ApplePlatformState = {
  ready: boolean;
  kind: ApplePlatformKind | null;
};

const PENDING_SNAPSHOT: ApplePlatformState = { ready: false, kind: null };

let clientHydrated = false;
let cachedSnapshot: ApplePlatformState = PENDING_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  listeners.add(onStoreChange);
  const schedule =
    typeof queueMicrotask === "function"
      ? queueMicrotask
      : (fn: () => void) => {
          void Promise.resolve().then(fn);
        };
  schedule(() => {
    if (clientHydrated) return;
    clientHydrated = true;
    const kind = getApplePlatformKind();
    cachedSnapshot = { ready: true, kind };
    for (const l of listeners) l();
  });
  return () => listeners.delete(onStoreChange);
}

function getSnapshot(): ApplePlatformState {
  if (typeof window === "undefined" || !clientHydrated) {
    return PENDING_SNAPSHOT;
  }
  const kind = getApplePlatformKind();
  if (cachedSnapshot.ready && cachedSnapshot.kind === kind) {
    return cachedSnapshot;
  }
  cachedSnapshot = { ready: true, kind };
  return cachedSnapshot;
}

function getServerSnapshot(): ApplePlatformState {
  return PENDING_SNAPSHOT;
}

export function useApplePlatformKind(): ApplePlatformState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
