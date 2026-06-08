"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { ArrowUpIcon, PlusIcon } from "./icons";

export function ActionButtons() {
  const { t } = useLanguage();

  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      <Link href="/deposit" className="btn btn-gradient">
        <PlusIcon className="h-[1.1rem] w-[1.1rem]" />
        {t("home.deposit")}
      </Link>
      <Link href="/withdraw" className="btn btn-outline">
        <ArrowUpIcon className="h-[1.1rem] w-[1.1rem]" />
        {t("home.withdraw")}
      </Link>
    </div>
  );
}
