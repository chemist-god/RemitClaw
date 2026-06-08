"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { LanguageSelector } from "./LanguageSelector";
import { ProfileWalletCard } from "./ProfileWalletCard";
import { WalletAssets } from "./WalletAssets";
import { ChevronLeftIcon } from "./icons";
import { PROFILE } from "../data/people";
import { useLanguage } from "../context/LanguageContext";

export function ProfileContent() {
  const { t } = useLanguage();

  return (
    <>
      <header className="flex items-center px-5 pb-3 pt-5">
        <Link href="/home" className="icon-btn" aria-label={t("common.back")}>
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[1.05rem] font-bold">
          {t("profile.title")}
        </h1>
        <span className="w-10" />
      </header>

      <div className="screen px-5 pb-8">
        <div className="flex flex-col items-center pt-4 text-center">
          <Avatar name={PROFILE.name} src={PROFILE.avatar} size={88} ring />
          <h2 className="mt-4 text-xl font-bold text-ink">{PROFILE.name}</h2>
          <p className="mt-1 text-sm text-muted">{t("profile.walletSubtitle")}</p>
        </div>

        <LanguageSelector variant="row" />

        <ProfileWalletCard />
        <WalletAssets />

        <div className="mt-8 flex flex-col gap-2">
          {[
            { label: t("profile.accountDetails"), value: t("profile.verified") },
            { label: t("profile.dailyLimit"), value: "$500 USD" },
            { label: t("profile.singleLimit"), value: "$200 USD" },
            { label: t("profile.defaultCorridor"), value: "USDm → PHP" },
          ].map((row) => (
            <div key={row.label} className="asset-row">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{row.label}</p>
              </div>
              <p className="text-sm font-semibold text-brand-600">{row.value}</p>
            </div>
          ))}
        </div>

        <Link href="/people" className="btn btn-gradient btn-block mt-8">
          {t("profile.manageContacts")}
        </Link>
      </div>
    </>
  );
}
