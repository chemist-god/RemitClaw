"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cancelSchedule,
  fetchSchedules,
  toggleSchedule,
  type ScheduleItem,
} from "../lib/api";
import { useLanguage } from "../context/LanguageContext";

function formatNextRun(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecurringSchedules() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { schedules } = await fetchSchedules();
      setItems(schedules);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load schedules");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (item: ScheduleItem) => {
    try {
      const { schedule } = await toggleSchedule(item.id, !item.active);
      setItems((prev) => prev.map((s) => (s.id === schedule.id ? schedule : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cancelSchedule(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <section className="mt-7">
        <h2 className="text-[1.05rem] text-ink">{t("recurring.title")}</h2>
        <p className="mt-3 text-sm text-muted">{t("common.syncing")}</p>
      </section>
    );
  }

  return (
    <section className="mt-7">
      <h2 className="text-[1.05rem] text-ink">{t("recurring.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("recurring.hint")}</p>

      {error && <p className="mt-3 text-sm text-brand-600">{error}</p>}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("recurring.empty")}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="asset-row flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {item.intent.amount} {item.intent.sourceCurrency} →{" "}
                  {item.intent.destinationCountry}
                </p>
                <p className="text-xs text-muted">
                  {item.intent.frequency} · {t("recurring.next")}{" "}
                  {formatNextRun(item.nextRunAt)}
                </p>
                {item.intent.recipientName && (
                  <p className="text-xs text-soft">{item.intent.recipientName}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="btn btn-outline px-3 py-1.5 text-xs"
                  onClick={() => void handleToggle(item)}
                >
                  {item.active ? t("recurring.pause") : t("recurring.resume")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline px-3 py-1.5 text-xs text-brand-600"
                  onClick={() => void handleDelete(item.id)}
                >
                  {t("recurring.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
