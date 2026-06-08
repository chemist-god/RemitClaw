"use client";

import { useMemo } from "react";
import { useAgentApi } from "../context/AgentApiContext";
import { useWalletPreferences } from "../context/WalletPreferencesContext";
import { CurrencyPickerButton } from "./CurrencyPickerSheet";
import { EyeIcon, EyeOffIcon } from "./icons";

function symbolToCode(symbol: string): string {
  return symbol.replace(/m$/, "");
}

function totalForCode(
  items: { symbol: string; balance: number }[],
  code: string
): number {
  if (code === "USD") return items.reduce((sum, item) => sum + item.balance, 0);
  return (
    items.find((item) => symbolToCode(item.symbol) === code)?.balance ?? 0
  );
}

export function BalanceAmount() {
  const {
    balanceVisible,
    toggleBalanceVisible,
    currencyCode,
    currency,
  } = useWalletPreferences();
  const { balances, balancesLoading, balancesError } = useAgentApi();

  const amount = useMemo(
    () => totalForCode(balances, currencyCode),
    [balances, currencyCode]
  );

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
          balancesLoading ? (
            <span className="text-soft">…</span>
          ) : balancesError ? (
            <span className="text-[1.5rem] text-soft">—</span>
          ) : (
            <>
              {currency.symbol}
              {whole}
              <span className="text-soft">.{cents}</span>
            </>
          )
        ) : (
          <span className="tracking-widest text-soft">••••••</span>
        )}
      </h1>
      {balancesError && balanceVisible && !balancesLoading && (
        <p className="mt-1 text-xs text-muted">{balancesError}</p>
      )}
    </>
  );
}
