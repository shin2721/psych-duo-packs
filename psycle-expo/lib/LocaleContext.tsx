import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "./i18n";
import localeConfig from "../config/locales.json";

const LOCALE_STORAGE_KEY = "appLocale";

// Every locale the product may ever offer (source + generation targets).
export type SupportedLocale = "ja" | "en" | "es" | "zh" | "fr" | "de" | "ko" | "pt";

// Labels for all known locales; only the active ones (config/locales.json) are offered.
const LOCALE_LABELS: Array<{ code: SupportedLocale; label: string }> = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
];

// Active locales: registered in lib/i18n.ts and validated by CI. Anything else
// is normalized to the source locale (ja) so a device set to an inactive
// language gets a coherent ja UI instead of a half-translated one.
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = localeConfig.active as SupportedLocale[];

export const LOCALE_OPTIONS: Array<{ code: SupportedLocale; label: string }> = LOCALE_LABELS.filter((option) =>
  SUPPORTED_LOCALES.includes(option.code)
);

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
