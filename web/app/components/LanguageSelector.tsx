"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import type { UiLocale } from "../i18n/types";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { MobileSheet } from "./MobileSheet";

const LOCALE_FLAGS: Record<UiLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  pt: "🇧🇷",
  fr: "🇫🇷",
};

type LanguageSelectorProps = {
  variant?: "row" | "chips" | "compact";
};

function LanguagePickerSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, setLocale, locales, t } = useLanguage();

  const handleSelect = (code: UiLocale) => {
    setLocale(code);
    onClose();
  };

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={t("common.language")}
      stacked
    >
      <div className="sheet-list">
        <div className="sheet-options">
          {locales.map((item) => {
            const selected = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                className={`sheet-option ${selected ? "sheet-option-active" : ""}`}
                onTouchStart={() => handleSelect(item.code)}
                onClick={() => handleSelect(item.code)}
              >
                <span className="sheet-option-flag" aria-hidden>
                  {LOCALE_FLAGS[item.code]}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold text-ink">
                    {item.native}
                  </span>
                  <span className="text-xs font-medium text-soft">
                    {item.label}
                  </span>
                </span>
                {selected ? (
                  <CheckIcon className="h-5 w-5 shrink-0 text-brand-600" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </MobileSheet>
  );
}

export function LanguageSelector({ variant = "chips" }: LanguageSelectorProps) {
  const { locale, setLocale, locales, t } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          className="lang-picker-btn"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          aria-label={t("common.language")}
          onTouchStart={() => setPickerOpen(true)}
          onClick={() => setPickerOpen(true)}
        >
          <span className="lang-picker-flag" aria-hidden>
            {LOCALE_FLAGS[locale]}
          </span>
          <span className="lang-picker-code">{locale.toUpperCase()}</span>
          <ChevronDownIcon className="lang-picker-chevron" aria-hidden />
        </button>

        <LanguagePickerSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
        />
      </>
    );
  }

  if (variant === "row") {
    return (
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-ink">{t("common.language")}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {locales.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`rounded-[var(--radius-lg)] border px-3 py-3 text-left transition ${
                locale === item.code
                  ? "border-brand-400 bg-brand-50"
                  : "border-line bg-surface"
              }`}
              onClick={() => setLocale(item.code)}
              aria-pressed={locale === item.code}
            >
              <span className="block text-sm font-semibold text-ink">
                {item.native}
              </span>
              <span className="text-xs text-muted">{item.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {locales.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`chip ${locale === item.code ? "chip-active" : ""}`}
          onClick={() => setLocale(item.code as UiLocale)}
          aria-pressed={locale === item.code}
        >
          {item.native}
        </button>
      ))}
    </div>
  );
}
