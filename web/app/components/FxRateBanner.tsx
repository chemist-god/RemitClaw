"use client";

import type { QuoteResponse } from "../lib/api";

type FxRateBannerProps = {
  quote: QuoteResponse;
  onSetAlert?: () => void;
  alertLabel?: string;
};

export function FxRateBanner({ quote, onSetAlert, alertLabel }: FxRateBannerProps) {
  if (
    quote.kind !== "quote" ||
    quote.exchangeRate == null ||
    !quote.destinationCurrency
  ) {
    return null;
  }

  const { intent, exchangeRate, destinationCurrency, recipientReceives } = quote;
  const inverse =
    exchangeRate > 0 ? (1 / exchangeRate).toFixed(4) : undefined;

  return (
    <div className="fx-rate-banner mt-2 rounded-[var(--radius-lg)] border border-accent-200 bg-accent-50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-accent-700">
            Live Mento rate
          </p>
          <p className="mt-0.5 tnum text-sm font-bold text-ink">
            1 {intent.sourceCurrency} ≈ {exchangeRate.toFixed(4)} {destinationCurrency}
          </p>
          {inverse && (
            <p className="tnum text-xs text-muted">
              1 {destinationCurrency} ≈ {inverse} {intent.sourceCurrency}
            </p>
          )}
          {recipientReceives != null && (
            <p className="mt-1 text-xs text-muted">
              {intent.amount} {intent.sourceCurrency} → ~{recipientReceives.toFixed(2)}{" "}
              {destinationCurrency}
            </p>
          )}
        </div>
        {onSetAlert && alertLabel ? (
          <button
            type="button"
            className="shrink-0 text-xs font-semibold text-brand-700 underline underline-offset-2"
            onClick={onSetAlert}
          >
            {alertLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
