import Link from "next/link";
import { Avatar } from "../components/Avatar";
import { PhoneShell } from "../components/PhoneShell";
import { TokenIcon } from "../components/TokenIcon";
import { ChevronLeftIcon } from "../components/icons";
import { PROFILE, WALLET_ASSETS } from "../data/people";

export default function ProfileScreen() {
  return (
    <PhoneShell>
      <header className="flex items-center px-5 pb-3 pt-5">
        <Link href="/home" className="icon-btn" aria-label="Back">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[1.05rem] font-bold">Profile</h1>
        <span className="w-10" />
      </header>

      <div className="screen px-5 pb-8">
        <div className="flex flex-col items-center pt-4 text-center">
          <Avatar name={PROFILE.name} src={PROFILE.avatar} size={88} ring />
          <h2 className="mt-4 text-xl font-bold text-ink">{PROFILE.name}</h2>
          <p className="mt-1 text-sm text-muted">RemitClaw wallet · Celo</p>
        </div>

        <section className="mt-8">
          <h2 className="text-[1.05rem] text-ink">Your assets</h2>
          <div className="mt-3 flex flex-col gap-2">
            {WALLET_ASSETS.map((asset) => (
              <div key={asset.symbol} className="asset-row">
                <TokenIcon src={asset.logo} alt={asset.symbol} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{asset.symbol}</p>
                  <p className="text-xs text-muted">{asset.name}</p>
                </div>
                <div className="text-right">
                  <p className="tnum font-bold text-ink">
                    {asset.balance.toLocaleString()} {asset.code}
                  </p>
                  <p className="text-xs font-semibold text-soft">{asset.symbol}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-2">
          {[
            { label: "Account details", value: "Verified" },
            { label: "Daily limit", value: "$500 USD" },
            { label: "Single transfer limit", value: "$200 USD" },
            { label: "Default corridor", value: "USDm → PHP" },
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
          Manage contacts
        </Link>
      </div>
    </PhoneShell>
  );
}
