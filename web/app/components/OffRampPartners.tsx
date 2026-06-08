"use client";

import { useLanguage } from "../context/LanguageContext";

const PARTNERS = [
  {
    id: "gcash",
    name: "GCash",
    region: "Philippines",
    status: "coming" as const,
  },
  {
    id: "mpesa",
    name: "M-Pesa",
    region: "Kenya",
    status: "coming" as const,
  },
  {
    id: "pix",
    name: "Pix",
    region: "Brazil",
    status: "coming" as const,
  },
];

export function OffRampPartners() {
  const { t } = useLanguage();

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("withdraw.cashOut")}
      </p>
      <p className="mt-1 text-sm text-muted">{t("withdraw.cashOutHint")}</p>
      <div className="mt-3 flex flex-col gap-2">
        {PARTNERS.map((p) => (
          <div key={p.id} className="asset-row">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{p.name}</p>
              <p className="text-xs text-muted">{p.region}</p>
            </div>
            <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-soft">
              {t("withdraw.comingSoon")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
