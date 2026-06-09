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
import {
  DISPLAY_CURRENCIES,
  getBalanceForCurrency,
  getCurrencyByCode,
} from "../data/currencies";

const STORAGE_KEY = "remitclaw-wallet-prefs";

type StoredPrefs = {
  balanceVisible: boolean;
  currencyCode: string;
  defaultCorridorId: string;
};

const DEFAULT_PREFS: StoredPrefs = {
  balanceVisible: true,
  currencyCode: "USD",
  defaultCorridorId: "usd-php",
};

type WalletPreferencesContextValue = {
  balanceVisible: boolean;
  toggleBalanceVisible: () => void;
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  defaultCorridorId: string;
  setDefaultCorridorId: (id: string | ((current: string) => string)) => void;
  currency: ReturnType<typeof getCurrencyByCode>;
  balanceAmount: number;
};

const WalletPreferencesContext =
  createContext<WalletPreferencesContextValue | null>(null);

function readStoredPrefs(): StoredPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    const currencyCode = DISPLAY_CURRENCIES.some(
      (item) => item.code === parsed.currencyCode
    )
      ? parsed.currencyCode!
      : DEFAULT_PREFS.currencyCode;

    return {
      balanceVisible:
        typeof parsed.balanceVisible === "boolean"
          ? parsed.balanceVisible
          : DEFAULT_PREFS.balanceVisible,
      currencyCode,
      defaultCorridorId:
        typeof parsed.defaultCorridorId === "string"
          ? parsed.defaultCorridorId
          : DEFAULT_PREFS.defaultCorridorId,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function WalletPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(readStoredPrefs());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, ready]);

  const toggleBalanceVisible = useCallback(() => {
    setPrefs((current) => ({
      ...current,
      balanceVisible: !current.balanceVisible,
    }));
  }, []);

  const setCurrencyCode = useCallback((currencyCode: string) => {
    if (!DISPLAY_CURRENCIES.some((item) => item.code === currencyCode)) return;
    setPrefs((current) => ({ ...current, currencyCode }));
  }, []);

  const setDefaultCorridorId = useCallback((idOrUpdater: string | ((current: string) => string)) => {
    setPrefs((current) => ({
      ...current,
      defaultCorridorId:
        typeof idOrUpdater === "function"
          ? idOrUpdater(current.defaultCorridorId)
          : idOrUpdater,
    }));
  }, []);

  const currency = getCurrencyByCode(prefs.currencyCode);
  const balanceAmount = getBalanceForCurrency(prefs.currencyCode);

  const value = useMemo(
    () => ({
      balanceVisible: prefs.balanceVisible,
      toggleBalanceVisible,
      currencyCode: prefs.currencyCode,
      setCurrencyCode,
      defaultCorridorId: prefs.defaultCorridorId,
      setDefaultCorridorId,
      currency,
      balanceAmount,
    }),
    [
      prefs.balanceVisible,
      prefs.currencyCode,
      prefs.defaultCorridorId,
      toggleBalanceVisible,
      setCurrencyCode,
      setDefaultCorridorId,
      currency,
      balanceAmount,
    ]
  );

  return (
    <WalletPreferencesContext.Provider value={value}>
      {children}
    </WalletPreferencesContext.Provider>
  );
}

export function useWalletPreferences() {
  const ctx = useContext(WalletPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useWalletPreferences must be used within WalletPreferencesProvider"
    );
  }
  return ctx;
}
