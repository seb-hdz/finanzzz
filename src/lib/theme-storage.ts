export const THEME_STORAGE_KEY = "finanzzz-theme" as const;
export const THEME_AUTO_DARK_AT_KEY = "finanzzz-theme-auto-dark-at" as const;

/** Default 6:30 p.m. (24h). */
export const DEFAULT_AUTO_DARK_AT = "18:30" as const;

export type ThemePreference = "light" | "dark";
export type ThemeStorageMode = ThemePreference | "auto";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Normalizes to `HH:mm` or returns default. */
export function normalizeAutoDarkAt(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return DEFAULT_AUTO_DARK_AT;
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m) return DEFAULT_AUTO_DARK_AT;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  if (Number.isNaN(h) || Number.isNaN(min)) return DEFAULT_AUTO_DARK_AT;
  return `${pad2(h)}:${pad2(min)}`;
}

export function autoDarkAtToMinutes(hhmm: string): number {
  const n = normalizeAutoDarkAt(hhmm);
  const [h, m] = n.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function resolveThemeForMode(
  mode: ThemeStorageMode,
  autoDarkAt: string,
  when: Date = new Date()
): ThemePreference {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  const threshold = autoDarkAtToMinutes(autoDarkAt);
  const now = when.getHours() * 60 + when.getMinutes();
  return now >= threshold ? "dark" : "light";
}

export function readStoredThemeMode(): ThemeStorageMode {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as string | null;
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readAutoDarkAt(): string {
  if (typeof window === "undefined") {
    return DEFAULT_AUTO_DARK_AT;
  }
  return normalizeAutoDarkAt(localStorage.getItem(THEME_AUTO_DARK_AT_KEY));
}

/** Inline bootstrap for root layout head; must match theme provider behavior. */
export function getThemeBootstrapScript(): string {
  const k = THEME_STORAGE_KEY;
  const ak = THEME_AUTO_DARK_AT_KEY;
  const def = DEFAULT_AUTO_DARK_AT;
  return `!function(){try{var k="${k}",ak="${ak}",def="${def}";var s=localStorage.getItem(k);var tr=localStorage.getItem(ak)||def;var p=tr.split(":");var h=parseInt(p[0],10),m=parseInt(p[1],10);var dm=isNaN(h)||isNaN(m)?18*60+30:h*60+m;if(dm<0||dm>1439)dm=18*60+30;var now=new Date();var nm=now.getHours()*60+now.getMinutes();var d=false;if(s==="auto"){d=nm>=dm;}else if(s==="dark"){d=true;}else if(s==="light"){d=false;}else{d=matchMedia("(prefers-color-scheme: dark)").matches;}document.documentElement.classList.toggle("dark",d);}catch(e){}}()`;
}
