"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type FontSize = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Settings {
  theme: ThemeMode;
  buttonSize: FontSize;
  questionSize: FontSize;
  choiceSize: FontSize;
  explanationSize: FontSize;
}

interface SettingsContextType {
  settings: Settings;
  setTheme: (theme: ThemeMode) => void;
  setButtonSize: (size: FontSize) => void;
  setQuestionSize: (size: FontSize) => void;
  setChoiceSize: (size: FontSize) => void;
  setExplanationSize: (size: FontSize) => void;
  getFontSizeClass: (size: FontSize) => string;
  getButtonSizeClass: (size: FontSize) => string;
}

const defaultSettings: Settings = {
  theme: "light",
  buttonSize: 4,
  questionSize: 4,
  choiceSize: 4,
  explanationSize: 4,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = "app-settings";

// Font size classes for text
const fontSizeClasses: Record<FontSize, string> = {
  1: "text-[10px] leading-tight",    // iPhone SE small
  2: "text-[11px] leading-tight",
  3: "text-xs leading-snug",         // 12px
  4: "text-sm leading-relaxed",      // 14px - default
  5: "text-base leading-relaxed",    // 16px
  6: "text-lg leading-relaxed",      // 18px
  7: "text-xl leading-relaxed",      // 20px - PC large
};

// Button size classes
const buttonSizeClasses: Record<FontSize, string> = {
  1: "text-[10px] py-2 px-3 min-h-[32px]",
  2: "text-[11px] py-2 px-3 min-h-[36px]",
  3: "text-xs py-2.5 px-4 min-h-[40px]",
  4: "text-sm py-3 px-4 min-h-[44px]",
  5: "text-base py-3 px-5 min-h-[48px]",
  6: "text-lg py-4 px-6 min-h-[56px]",
  7: "text-xl py-5 px-8 min-h-[64px]",
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle missing properties
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        // Ignore parse errors
      }
    }
    setMounted(true);
  }, []);

  // Apply settings to document
  useEffect(() => {
    if (!mounted) return;

    // Apply theme
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(settings.theme);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  const setTheme = (theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setButtonSize = (buttonSize: FontSize) => {
    setSettings((prev) => ({ ...prev, buttonSize }));
  };

  const setQuestionSize = (questionSize: FontSize) => {
    setSettings((prev) => ({ ...prev, questionSize }));
  };

  const setChoiceSize = (choiceSize: FontSize) => {
    setSettings((prev) => ({ ...prev, choiceSize }));
  };

  const setExplanationSize = (explanationSize: FontSize) => {
    setSettings((prev) => ({ ...prev, explanationSize }));
  };

  const getFontSizeClass = (size: FontSize) => fontSizeClasses[size];
  const getButtonSizeClass = (size: FontSize) => buttonSizeClasses[size];

  if (!mounted) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setTheme,
        setButtonSize,
        setQuestionSize,
        setChoiceSize,
        setExplanationSize,
        getFontSizeClass,
        getButtonSizeClass,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export const fontSizeLabels: Record<FontSize, string> = {
  1: "極小",
  2: "小",
  3: "やや小",
  4: "標準",
  5: "やや大",
  6: "大",
  7: "極大",
};
