"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppSettings = {
  theme: "discord" | "midnight" | "amoled";
  compactMode: boolean;
  reduceMotion: boolean;
  largeText: boolean;
};

type AppSettingsContextValue = {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "discord",
  compactMode: false,
  reduceMotion: false,
  largeText: false,
};

const STORAGE_KEY = "discord-clone:app-settings";

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  setSetting: () => undefined,
  resetSettings: () => undefined,
});

function applySettingsToDom(settings: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("app-theme-discord", "app-theme-midnight", "app-theme-amoled");
  root.classList.add(`app-theme-${settings.theme}`);
  root.classList.toggle("app-compact", settings.compactMode);
  root.classList.toggle("app-reduced-motion", settings.reduceMotion);
  root.classList.toggle("app-large-text", settings.largeText);
}

export const AppSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        applySettingsToDom(DEFAULT_SETTINGS);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      setSettings(merged);
      applySettingsToDom(merged);
    } catch {
      applySettingsToDom(DEFAULT_SETTINGS);
    }
  }, []);

  const setSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applySettingsToDom(next);
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    applySettingsToDom(DEFAULT_SETTINGS);
  };

  const value = useMemo(
    () => ({ settings, setSetting, resetSettings }),
    [settings]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);

