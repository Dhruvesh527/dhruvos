"use client";

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, parseSettings, settingsReducer, type OsSettings, type SettingsAction } from "@/lib/os-settings.mjs";

const SettingsContext = createContext<{ settings: OsSettings; update: Dispatch<SettingsAction> } | null>(null);

/** Holds the visitor's desktop preferences and remembers them in this browser. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  // Start from defaults so the server and first client render match; load saved values after mounting.
  const [settings, update] = useReducer(settingsReducer, DEFAULT_SETTINGS);
  const loaded = useRef(false);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(SETTINGS_KEY); } catch {}
    if (saved) update({ type: "load", value: parseSettings(saved) });
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
