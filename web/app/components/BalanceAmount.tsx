"use client";

import { useEffect, useState } from "react";
import { useWalletPreferences } from "../context/WalletPreferencesContext";
import { CurrencyPickerButton } from "./CurrencyPickerSheet";
import { EyeIcon, EyeOffIcon } from "./icons";
import { fetchAgentAddress, fetchBalances } from "../lib/api";

type LiveItem = { symbol: string; balance: number };

/** Map a token symbol (USDm) to its display currency code (USD). */
function symbolToCode(symbol: string): string {
  return symbol.replace(/m$/, "");
}

/** Total for a currency from live balances; USD sums everything (demo parity). */
function liveTotalForCode(items: LiveItem[], code: string): number {
  if (code === "USD") return items.reduce((sum, item) => sum + item.balance, 0);
  return items.find((item) => symbolToCode(item.symbol) === code)?.balance ?? 0;
}

export function BalanceAmount() {
  const {
    balanceVisible,
    toggleBalanceVisible,
    currency,
    currencyCode,
    balanceAmount,
  } = useWalletPreferences();

  const [liveItems, setLiveItems] = useState<LiveItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const agent = await fetchAgentAddress();
        if (!agent.address) return;
        const { items } = await fetchBalances(agent.address);
        if (!cancelled && items.length > 0) setLiveItems(items);
      } catch {
        // Keep the static balance when the agent API is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const amount = liveItems
    ? liveTotalForCode(liveItems, currencyCode)
    : balanceAmount;

  const [whole, cents] = amount.toFixed(2).split(".");

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[0.85rem] font-semibold text-muted">
            Total Balance
          </span>
          <button
            type="button"
            onTouchStart={toggleBalanceVisible}
            onClick={toggleBalanceVisible}
            className="balance-toggle-btn"
            aria-label={balanceVisible ? "Hide balance" : "Show balance"}
          >
            {balanceVisible ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeOffIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        <CurrencyPickerButton />
      </div>
      <h1 className="tnum mt-1 text-[2.9rem] leading-none text-ink">
        {balanceVisible ? (
          <>
            {currency.symbol}
            {whole}
            <span className="text-soft">.{cents}</span>
          </>
        ) : (
          <span className="tracking-widest text-soft">••••••</span>
        )}
      </h1>
    </>
  );
}
