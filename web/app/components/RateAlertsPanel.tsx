"use client";

import { useEffect, useState } from "react";
import {
  addRateAlert,
  listRateAlerts,
  removeRateAlert,
  type RateAlert,
} from "../lib/rate-alerts";
import { useLanguage } from "../context/LanguageContext";

export function RateAlertsPanel() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [corridor, setCorridor] = useState("USD-PH");
  const [source, setSource] = useState("USD");
  const [dest, setDest] = useState("PHP");
  const [target, setTarget] = useState("58");

  useEffect(() => {
    setAlerts(listRateAlerts());
  }, []);

  const handleAdd = () => {
    const targetRate = parseFloat(target);
    if (!Number.isFinite(targetRate) || targetRate <= 0) return;
    const alert = addRateAlert({
      corridor: corridor.toUpperCase(),
      sourceCurrency: source.toUpperCase(),
      destinationCurrency: dest.toUpperCase(),
      targetRate,
    });
    setAlerts((prev) => [...prev.filter((a) => a.id !== alert.id), alert]);
  };

  return (
    <section className="mt-7">
      <h2 className="text-[1.05rem] text-ink">{t("rateAlerts.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("rateAlerts.hint")}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <input
          type="text"
          value={corridor}
          onChange={(e) => setCorridor(e.target.value)}
          placeholder="USD-PH"
          className="form-field font-mono text-sm"
        />
        <input
          type="number"
          step="0.0001"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="58.0"
          className="form-field tnum text-sm"
        />
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="USD"
          className="form-field text-sm"
        />
        <input
          type="text"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="PHP"
          className="form-field text-sm"
        />
      </div>
      <button
        type="button"
        className="btn btn-outline btn-block mt-3"
        onClick={handleAdd}
      >
        {t("rateAlerts.add")}
      </button>

      {alerts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("rateAlerts.empty")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {alerts.map((a) => (
            <div key={a.id} className="asset-row">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {a.corridor}: ≥ {a.targetRate} {a.destinationCurrency}/{a.sourceCurrency}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-brand-600"
                onClick={() => {
                  removeRateAlert(a.id);
                  setAlerts((prev) => prev.filter((x) => x.id !== a.id));
                }}
              >
                {t("rateAlerts.remove")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
