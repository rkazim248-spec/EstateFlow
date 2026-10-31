"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ACCENTS } from "@/lib/constants";

export type AppearanceMode = "light" | "dark" | "system";
export type ResolvedAppearance = "light" | "dark";

const STORAGE_KEY = "estateflow.appearance";

interface StoredAppearance {
  mode: AppearanceMode;
  accent: string;
}

interface ThemeContextValue {
  mode: AppearanceMode;
  accent: string;
  resolved: ResolvedAppearance;
  setMode: (mode: AppearanceMode) => void;
  setAccent: (accent: string) => void;
  /** Applies preferences loaded from Firestore without re-saving them. */
  applyRemotePreferences: (mode: AppearanceMode, accent: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isMode(value: unknown): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

function isAccent(value: unknown): value is string {
  return typeof value === "string" && ACCENTS.some((accent) => accent.id === value);
}

function readStored(): StoredAppearance {
  if (typeof window === "undefined") return { mode: "system", accent: "teal" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: "system", accent: "teal" };
    const parsed = JSON.parse(raw) as Partial<StoredAppearance>;
    return {
      mode: isMode(parsed.mode) ? parsed.mode : "system",
      accent: isAccent(parsed.accent) ? parsed.accent : "teal",
    };
  } catch {
    return { mode: "system", accent: "teal" };
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>("system");
  const [accent, setAccentState] = useState("teal");
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted preferences after mount so the server render matches the
  // client's first paint. The inline script in layout.tsx has already applied
  // the correct colours before paint.
  useEffect(() => {
    const stored = readStored();
    setModeState(stored.mode);
    setAccentState(stored.accent);
    setSystemDark(systemPrefersDark());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolved: ResolvedAppearance =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.accent = accent;
    root.style.colorScheme = resolved;
  }, [resolved, accent, hydrated]);

  const persist = useCallback((next: StoredAppearance) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable in private mode; the session still updates.
    }
  }, []);

  const setMode = useCallback(
    (next: AppearanceMode) => {
      setModeState(next);
      persist({ mode: next, accent });
    },
    [accent, persist],
  );

  const setAccent = useCallback(
    (next: string) => {
      const safe = isAccent(next) ? next : "teal";
      setAccentState(safe);
      persist({ mode, accent: safe });
    },
    [mode, persist],
  );

  const applyRemotePreferences = useCallback(
    (nextMode: AppearanceMode, nextAccent: string) => {
      const safeMode = isMode(nextMode) ? nextMode : "system";
      const safeAccent = isAccent(nextAccent) ? nextAccent : "teal";
      setModeState(safeMode);
      setAccentState(safeAccent);
      persist({ mode: safeMode, accent: safeAccent });
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      mode,
      accent,
      resolved,
      setMode,
      setAccent,
      applyRemotePreferences,
    }),
    [mode, accent, resolved, setMode, setAccent, applyRemotePreferences],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return context;
}
