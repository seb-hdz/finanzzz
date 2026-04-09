"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_AUTO_DARK_AT,
  normalizeAutoDarkAt,
  readAutoDarkAt,
  readStoredThemeMode,
  resolveThemeForMode,
  THEME_AUTO_DARK_AT_KEY,
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ThemeStorageMode,
} from "@/lib/theme-storage";

type ThemeContextValue = {
  theme: ThemePreference;
  themeMode: ThemeStorageMode;
  setThemeMode: (mode: ThemeStorageMode) => void;
  autoDarkAt: string;
  setAutoDarkAt: (hhmm: string) => void;
  toggle: () => void;
};

/** Fills missing fields when an older cached JS bundle only provided part of the context (e.g. Safari PWA). */
const THEME_CONTEXT_FALLBACK: ThemeContextValue = {
  theme: "light",
  themeMode: "light",
  setThemeMode: () => {},
  autoDarkAt: DEFAULT_AUTO_DARK_AT,
  setAutoDarkAt: () => {},
  toggle: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(THEME_CONTEXT_FALLBACK);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return { ...THEME_CONTEXT_FALLBACK, ...ctx };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeStorageMode>(
    readStoredThemeMode
  );
  const [autoDarkAt, setAutoDarkAtState] = useState<string>(readAutoDarkAt);
  /** Bumps on a timer while in auto mode so scheduled dark/light updates apply. */
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());

  const autoDarkAtRef = useRef(autoDarkAt);
  useEffect(() => {
    autoDarkAtRef.current = autoDarkAt;
  }, [autoDarkAt]);

  const theme = useMemo(
    () => resolveThemeForMode(themeMode, autoDarkAt, new Date(scheduleNow)),
    [themeMode, autoDarkAt, scheduleNow]
  );

  useEffect(() => {
    if (themeMode !== "auto") return;
    const id = window.setInterval(() => {
      setScheduleNow(Date.now());
    }, 60_000);
    return () => clearInterval(id);
  }, [themeMode]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") setScheduleNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    localStorage.setItem(
      THEME_AUTO_DARK_AT_KEY,
      normalizeAutoDarkAt(autoDarkAt)
    );
  }, [theme, themeMode, autoDarkAt]);

  const setThemeMode = useCallback((mode: ThemeStorageMode) => {
    setThemeModeState(mode);
  }, []);

  const setAutoDarkAt = useCallback((hhmm: string) => {
    setAutoDarkAtState(normalizeAutoDarkAt(hhmm || DEFAULT_AUTO_DARK_AT));
  }, []);

  const toggle = useCallback(() => {
    setThemeModeState((prev) => {
      const resolved = resolveThemeForMode(prev, autoDarkAtRef.current);
      return resolved === "dark" ? "light" : "dark";
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        autoDarkAt,
        setAutoDarkAt,
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
