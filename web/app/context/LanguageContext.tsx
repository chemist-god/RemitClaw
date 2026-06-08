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
import { messages, type MessageTree } from "../i18n/messages";
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  UI_LOCALES,
  type UiLocale,
} from "../i18n/types";

type LanguageContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: typeof UI_LOCALES;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveMessage(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let cur: string | MessageTree = tree;
  for (const part of parts) {
    if (typeof cur !== "object" || cur === null || !(part in cur)) return undefined;
    cur = cur[part] as string | MessageTree;
  }
  return typeof cur === "string" ? cur : undefined;
}

function loadStoredLocale(): UiLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && UI_LOCALES.some((l) => l.code === raw)) return raw as UiLocale;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(loadStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw =
        resolveMessage(messages[locale], key) ??
        resolveMessage(messages[DEFAULT_LOCALE], key) ??
        key;
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (text, [k, v]) => text.replaceAll(`{${k}}`, String(v)),
        raw
      );
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: UI_LOCALES }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
