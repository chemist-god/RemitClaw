"use client";

import { useMemo } from "react";
import { TokenIcon } from "./TokenIcon";
import { useAgentApi } from "../context/AgentApiContext";
import { WALLET_ASSETS } from "../data/people";

const META = Object.fromEntries(
  [
    ...WALLET_ASSETS,
    { symbol: "PHPm", name: "Philippine Peso", logo: "/tokens/usdm.png", code: "PHP" },
    { symbol: "NGNm", name: "Nigerian Naira", logo: "/tokens/usdm.png", code: "NGN" },
  ].map((a) => [a.symbol, { name: a.name, logo: a.logo, code: a.code }])
);

export function WalletAssets() {
  const { balances, balancesLoading, balancesError } = useAgentApi();

  const rows = useMemo(
    () =>
      balances.map((item) => {
        const meta = META[item.symbol];
        return {
          symbol: item.symbol,
          name: meta?.name ?? item.symbol,
          logo: meta?.logo ?? "/tokens/usdm.png",
          code: meta?.code ?? item.symbol,
          balance: item.balance,
        };
      }),
    [balances]
  );

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.05rem] text-ink">Assets</h2>
        {rows.length > 0 && (
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-600">
            Live
          </span>
        )}
      </div>
      {balancesLoading && (
        <p className="mt-3 text-sm text-muted">Loading balances from agent…</p>
      )}
      {balancesError && !balancesLoading && (
        <p className="mt-3 text-sm text-muted">{balancesError}</p>
      )}
      {!balancesLoading && !balancesError && rows.length === 0 && (
        <p className="mt-3 text-sm text-muted">No on-chain balances yet.</p>
      )}
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((asset) => (
          <div key={asset.symbol} className="asset-row">
            <TokenIcon src={asset.logo} alt={asset.symbol} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{asset.symbol}</p>
              <p className="text-xs text-muted">{asset.name}</p>
            </div>
            <div className="text-right">
              <p className="tnum font-bold text-ink">
                {asset.balance.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {asset.code}
              </p>
              <p className="text-xs font-semibold text-accent-600">On-chain</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
