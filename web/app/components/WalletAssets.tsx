"use client";

import { useEffect, useState } from "react";
import { TokenIcon } from "./TokenIcon";
import { WALLET_ASSETS } from "../data/people";
import { fetchAgentAddress, fetchBalances } from "../lib/api";
import { useWallet } from "../context/WalletContext";

type AssetRow = {
  symbol: string;
  name: string;
  logo: string;
  code: string;
  balance: number;
  live: boolean;
};

const META = Object.fromEntries(
  WALLET_ASSETS.map((a) => [a.symbol, { name: a.name, logo: a.logo, code: a.code }])
);

const STATIC_ROWS: AssetRow[] = WALLET_ASSETS.map((a) => ({
  symbol: a.symbol,
  name: a.name,
  logo: a.logo,
  code: a.code,
  balance: a.balance,
  live: false,
}));

export function WalletAssets() {
  const { address: connectedAddress } = useWallet();
  const [rows, setRows] = useState<AssetRow[]>(STATIC_ROWS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Prefer the connected user wallet; fall back to the agent wallet (demo).
        const address =
          connectedAddress ?? (await fetchAgentAddress()).address;
        if (!address) return;
        const { items } = await fetchBalances(address);
        if (cancelled || items.length === 0) return;

        const next: AssetRow[] = items.map((item) => {
          const meta = META[item.symbol];
          return {
            symbol: item.symbol,
            name: meta?.name ?? item.symbol,
            logo: meta?.logo ?? "/tokens/usdm.png",
            code: meta?.code ?? item.symbol,
            balance: item.balance,
            live: true,
          };
        });
        setRows(next);
        setLive(true);
      } catch {
        // Keep static rows when no wallet/agent API is available.
        if (!cancelled) {
          setRows(STATIC_ROWS);
          setLive(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.05rem] text-ink">Assets</h2>
        {live && (
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[0.65rem] font-semibold text-accent-600">
            Live
          </span>
        )}
      </div>
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
              <p className="text-xs font-semibold text-muted">
                {asset.live ? "On-chain" : "Demo"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
