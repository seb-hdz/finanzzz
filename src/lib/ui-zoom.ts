/** Discrete zoom levels (% of the root font size). */
export const UI_ZOOM_STEPS = [80, 90, 100, 110, 120, 130] as const;

export type UiZoomPercent = (typeof UI_ZOOM_STEPS)[number];

export const DEFAULT_UI_ZOOM_PERCENT: UiZoomPercent = 100;

export function nearestUiZoomPercent(value: number): UiZoomPercent {
  let best: UiZoomPercent = UI_ZOOM_STEPS[0];
  let bestDist = Math.abs(value - best);
  for (const step of UI_ZOOM_STEPS) {
    const d = Math.abs(value - step);
    if (d < bestDist) {
      best = step;
      bestDist = d;
    }
  }
  return best;
}

export function normalizeUiZoomPercent(raw: unknown): UiZoomPercent {
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw)
        : Number.NaN;
  if (!Number.isFinite(n)) return DEFAULT_UI_ZOOM_PERCENT;
  const clamped = Math.min(130, Math.max(80, Math.round(n)));
  return nearestUiZoomPercent(clamped);
}

export function uiZoomStepIndex(percent: UiZoomPercent): number {
  return UI_ZOOM_STEPS.indexOf(percent);
}

/** Applies zoom via root `font-size` so `rem` UI scales consistently. */
export function applyUiZoomToDocument(percent: UiZoomPercent): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize =
    percent === DEFAULT_UI_ZOOM_PERCENT ? "" : `${percent}%`;
}
