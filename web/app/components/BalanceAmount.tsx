"use client";

import { useState } from "react";
import { useWalletPreferences } from "../context/WalletPreferencesContext";
import { CurrencyPickerButton } from "./CurrencyPickerSheet";
import { EyeIcon, EyeOffIcon } from "./icons";

export function BalanceAmount() {
  const {
    balanceVisible,
    toggleBalanceVisible,
    currency,
    balanceAmount,
  } = useWalletPreferences();

  const [whole, cents] = balanceAmount.toFixed(2).split(".");

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
