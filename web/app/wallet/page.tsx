import Link from "next/link";
import { AppHeader } from "../components/AppHeader";
import { ActionButtons } from "../components/ActionButtons";
import { Avatar } from "../components/Avatar";
import { BalanceSection } from "../components/BalanceSection";
import { PhoneShell } from "../components/PhoneShell";
import { TokenIcon } from "../components/TokenIcon";
import { findPerson, getAsset, RECENT_TX, WALLET_ASSETS } from "../data/people";

export default function WalletScreen() {
  return (
    <PhoneShell nav="wallet">
      <div className="screen screen-has-nav px-5 pt-5">
        <AppHeader />
        <BalanceSection />
        <ActionButtons />

        <section className="mt-7">
          <h2 className="text-[1.05rem] text-ink">Assets</h2>
          <div className="mt-3 flex flex-col gap-2.5">
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
                  <p
                    className={`text-xs font-semibold ${
                      asset.change.startsWith("+")
                        ? "text-accent-600"
                        : "text-muted"
                    }`}
                  >
                    {asset.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-[1.05rem] text-ink">Recent</h2>
          <div className="mt-3 flex flex-col gap-2">
            {RECENT_TX.map((tx) => {
              const person = findPerson(tx.to);
              const asset = getAsset(tx.currency);
              return (
                <Link key={tx.id} href={`/pay?to=${tx.to}&amount=${tx.amount}`} className="tx-row">
                  {person ? (
                    <Avatar name={person.name} src={person.avatar} size={40} />
                  ) : (
                    <div className="tx-icon">↑</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">Sent to {tx.to}</p>
                    <p className="text-xs text-muted">{tx.date}</p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="tnum font-bold text-ink">
                        -{tx.amount} {tx.currency}
                      </p>
                      <p
                        className={`text-xs font-semibold capitalize ${
                          tx.status === "confirmed"
                            ? "text-accent-600"
                            : "text-brand-500"
                        }`}
                      >
                        {tx.status}
                      </p>
                    </div>
                    {asset && <TokenIcon src={asset.logo} alt={asset.symbol} size={28} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PhoneShell>
  );
}
