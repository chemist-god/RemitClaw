"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConnectWallet } from "./ConnectWallet";
import { useWallet, shortAddress } from "../context/WalletContext";
import { useLanguage } from "../context/LanguageContext";

/** Wallet connect on the last onboarding step — uses app-wide ThirdwebProvider. */
export function InlineWalletSetup() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => router.push("/home"), 1200);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  return (
    <div className="mt-7 flex flex-col gap-3">
      {isConnected ? (
        <div className="rounded-[var(--radius-lg)] border border-accent-200 bg-accent-50 p-4 text-center">
          <p className="text-sm font-semibold text-accent-700">{t("auth.connected")}</p>
          <p className="tnum mt-1 text-sm text-muted">{shortAddress(address)}</p>
          <p className="mt-2 text-xs text-soft">{t("auth.takingHome")}</p>
        </div>
      ) : (
        <ConnectWallet label={t("onboarding.createWallet")} />
      )}

      <Link href="/home" className="btn btn-light btn-block">
        {t("onboarding.maybeLater")}
      </Link>
    </div>
  );
}
