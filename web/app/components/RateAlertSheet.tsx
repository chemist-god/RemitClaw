"use client";

import { useEffect, useState } from "react";
import { MobileSheet } from "./MobileSheet";
import { addRateAlert, corridorKey } from "../lib/rate-alerts";
import type { QuoteResponse } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

type RateAlertSheetProps = {
  open: boolean;
  onClose: () => void;
  quote: QuoteResponse | null;
};

export function RateAlertSheet({ open, onClose, quote }: RateAlertSheetProps) {
  const { t } = useLanguage();
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (quote?.exchangeRate != null) {
      setTarget(quote.exchangeRate.toFixed(4));
    }
  }, [quote]);

  if (quote?.kind !== "quote" || !quote.destinationCurrency) return null;

  const handleSave = () => {
    const targetRate = parseFloat(target);
    if (!Number.isFinite(targetRate) || targetRate <= 0) return;
    addRateAlert({
      corridor: corridorKey(
        quote.intent.sourceCurrency,
        quote.intent.destinationCountry
      ),
      sourceCurrency: quote.intent.sourceCurrency,
      destinationCurrency: quote.destinationCurrency ?? quote.intent.destinationCountry,
      targetRate,
    });
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={t("rateAlerts.sheetTitle")}
      subtitle={t("rateAlerts.sheetSub")}
    >
      <p className="text-sm text-muted">
        {quote.intent.sourceCurrency} → {quote.destinationCurrency} (
        {quote.intent.destinationCountry})
      </p>
      <label className="form-label mt-4" htmlFor="rate-alert-target">
        {t("rateAlerts.targetLabel")}
      </label>
      <input
        id="rate-alert-target"
        type="number"
        step="0.0001"
        min="0"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="form-field mt-2 w-full tnum"
      />
      <button
        type="button"
        className="btn btn-gradient btn-block mt-5"
        onClick={handleSave}
      >
        {saved ? t("rateAlerts.saved") : t("rateAlerts.add")}
      </button>
    </MobileSheet>
  );
}
