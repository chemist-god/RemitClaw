"use client";

import { useState } from "react";
import { useContacts } from "../context/ContactsContext";
import { useLanguage } from "../context/LanguageContext";
import { canPickPhoneContacts } from "../lib/phone-contacts";

type ImportPhoneContactsButtonProps = {
  variant?: "banner" | "chip";
};

export function ImportPhoneContactsButton({
  variant = "chip",
}: ImportPhoneContactsButtonProps) {
  const { importFromPhone, syncing } = useContacts();
  const { t } = useLanguage();
  const [result, setResult] = useState<string | null>(null);
  const supported = canPickPhoneContacts();

  if (!supported) return null;

  const handleImport = async () => {
    setResult(null);
    const count = await importFromPhone();
    if (count > 0) {
      setResult(t("people.synced", { count }));
    } else {
      setResult(t("people.noneSelected"));
    }
  };

  if (variant === "banner") {
    return (
      <div className="mt-5 rounded-[var(--radius-lg)] border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-900">
          {t("people.importTitle")}
        </p>
        <p className="mt-1 text-xs leading-5 text-brand-800/80">
          {t("people.importHint")}
        </p>
        <button
          type="button"
          className="btn btn-dark mt-3 w-full"
          disabled={syncing}
          onClick={() => void handleImport()}
        >
          {syncing ? t("common.syncing") : t("people.importButton")}
        </button>
        {result ? <p className="mt-2 text-xs text-brand-800">{result}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="chip"
        disabled={syncing}
        onClick={() => void handleImport()}
      >
        {syncing ? t("common.syncing") : t("people.importChip")}
      </button>
      {result ? <span className="text-xs text-soft">{result}</span> : null}
    </div>
  );
}
