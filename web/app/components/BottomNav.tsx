"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { BoltIcon, CardIcon, HomeIcon, UsersIcon } from "./icons";

export type NavTab = "home" | "wallet" | "people";

export function BottomNav({ active = "home" }: { active?: NavTab }) {
  const { t } = useLanguage();

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <Link
        href="/home"
        className="nav-item"
        data-active={active === "home"}
        aria-label={t("nav.home")}
      >
        <HomeIcon className="nav-icon" />
        {active === "home" && <span className="nav-label">{t("nav.home")}</span>}
      </Link>
      <Link
        href="/wallet"
        className="nav-item"
        data-active={active === "wallet"}
        aria-label={t("nav.wallet")}
      >
        <CardIcon className="nav-icon" />
        {active === "wallet" && <span className="nav-label">{t("nav.wallet")}</span>}
      </Link>
      <Link
        href="/people"
        className="nav-item"
        data-active={active === "people"}
        aria-label={t("nav.people")}
      >
        <UsersIcon className="nav-icon" />
        {active === "people" && <span className="nav-label">{t("nav.people")}</span>}
      </Link>
      <Link href="/pay" className="nav-item nav-item-pay" aria-label={t("nav.pay")}>
        <BoltIcon className="nav-icon" />
        <span className="nav-label">{t("nav.pay")}</span>
      </Link>
    </nav>
  );
}
