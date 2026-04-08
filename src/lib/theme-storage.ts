export const THEME_STORAGE_KEY = "finanzzz-theme" as const;

export type ThemePreference = "light" | "dark";

export function readInitialTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as
    | ThemePreference
    | null;
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  return stored ?? preferred;
}

/** Inline bootstrap for root layout head; must match {@link readInitialTheme}. */
export function getThemeBootstrapScript(): string {
  return `!function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}}()`;
}
