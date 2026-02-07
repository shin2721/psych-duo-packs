import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "./i18n";

const LOCALE_STORAGE_KEY = "appLocale";

export const SUPPORTED_LOCALES = ["ja", "en", "es", "zh", "fr", "de", "ko", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_OPTIONS: Array<{ code: SupportedLocale; label: string }> = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
];

type LocaleContextValue = {
  locale: SupportedLocale;
  options: Array<{ code: SupportedLocale; label: string }>;
  isReady: boolean;
  setLocale: (next: SupportedLocale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function normalizeLocale(input: string | null | undefined): SupportedLocale {
  const value = String(input || "").toLowerCase().split("-")[0] as SupportedLocale;
  return SUPPORTED_LOCALES.includes(value) ? value : "ja";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(normalizeLocale(i18n.locale));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        const resolved = normalizeLocale(stored || i18n.locale);
        i18n.locale = resolved;
        if (mounted) {
          setLocaleState(resolved);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = async (next: SupportedLocale) => {
    const resolved = normalizeLocale(next);
    i18n.locale = resolved;
    setLocaleState(resolved);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, resolved);
  };

  const value = useMemo(
    () => ({ locale, options: LOCALE_OPTIONS, isReady, setLocale }),
    [locale, isReady]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
