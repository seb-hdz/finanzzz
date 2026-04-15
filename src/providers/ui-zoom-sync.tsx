"use client";

import { useEffect } from "react";
import { useGlobalConfig } from "@/lib/db-hooks";
import {
  applyUiZoomToDocument,
  normalizeUiZoomPercent,
} from "@/lib/ui-zoom";

/** Keeps `document.documentElement` in sync with persisted `uiZoomPercent`. */
export function UiZoomSync() {
  const config = useGlobalConfig();

  useEffect(() => {
    const percent = normalizeUiZoomPercent(config?.uiZoomPercent);
    applyUiZoomToDocument(percent);
  }, [config?.uiZoomPercent]);

  useEffect(() => {
    return () => {
      applyUiZoomToDocument(100);
    };
  }, []);

  return null;
}
