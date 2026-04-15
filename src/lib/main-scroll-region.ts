/**
 * Scroll helpers for the app shell’s main column (`[data-app-main-scroll-region]`).
 * The document body does not scroll; only this region does.
 */

export const MAIN_SCROLL_REGION_SELECTOR =
  "[data-app-main-scroll-region]" as const;

/**
 * On `:root` (`html`): desired distance from the **layout viewport** top to the
 * target’s top edge after scrolling (see `globals.css`).
 */
export const VIEWPORT_ANCHOR_SCROLL_OFFSET_VAR =
  "--viewport-anchor-scroll-offset" as const;

/** Wait after navigation so layout + `.page-enter-stagger` (~0.48s) can settle. */
export const MAIN_VIEWPORT_ANCHOR_SCROLL_DELAY_MS = 480;

function parseCssPx(raw: string): number {
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) ? n : 0;
}

export function getMainScrollRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(MAIN_SCROLL_REGION_SELECTOR);
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scrolls `<main>` so `target.getBoundingClientRect().top` equals `offsetPx`
 * (layout viewport coordinates: 0 = flush with the top of the visible viewport).
 */
export function scrollMainRegionElementToViewportTop(
  target: HTMLElement,
  options?: { behavior?: ScrollBehavior }
): void {
  const main = getMainScrollRegion();
  if (!main) return;

  const offsetPx = parseCssPx(
    getComputedStyle(document.documentElement).getPropertyValue(
      VIEWPORT_ANCHOR_SCROLL_OFFSET_VAR
    )
  );

  const targetTop = target.getBoundingClientRect().top;
  const delta = targetTop - offsetPx;
  const top = Math.max(0, main.scrollTop + delta);

  const behavior =
    options?.behavior ??
    (prefersReducedMotion() ? ("instant" as ScrollBehavior) : "smooth");

  if (behavior === "instant" || behavior === "auto") {
    main.scrollTop = top;
  } else {
    main.scrollTo({ top, behavior: "smooth" });
  }
}

export function scrollMainRegionToElementId(
  elementId: string,
  options?: { behavior?: ScrollBehavior }
): void {
  const element = document.getElementById(elementId);
  if (!element) return;
  scrollMainRegionElementToViewportTop(element, options);
}

/** Matches `/settings` with optional leading base path (e.g. `/finanzzz/settings`). */
export function isSettingsPathname(pathname: string): boolean {
  return /\/settings$/.test(pathname.replace(/\/$/, ""));
}
