"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { WALLET_ASSETS } from "../data/people";
import { ConfirmationModal } from "./ConfirmationModal";
import { ChevronLeftIcon } from "./icons";
import { TokenIcon } from "./TokenIcon";

const QUICK_AMOUNTS = [50, 100, 250, 500];
const DEPOSIT_METHODS = ["Bank transfer", "Debit card", "Crypto wallet"];

type TransferFormProps = {
  mode: "deposit" | "withdraw";
  title: string;
  subtitle: string;
  actionLabel: string;
  backHref?: string;
};

export function TransferForm({
  mode,
  title,
  subtitle,
  actionLabel,
  backHref = "/home",
}: TransferFormProps) {
  const router = useRouter();
  const [asset, setAsset] = useState(WALLET_ASSETS[0].symbol);
  const [amount, setAmount] = useState("100");
  const [depositMethod, setDepositMethod] = useState(DEPOSIT_METHODS[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<"confirm" | "success">("confirm");

  const selected = WALLET_ASSETS.find((a) => a.symbol === asset) ?? WALLET_ASSETS[0];

  const modalDetails = useMemo(
    () => [
      { label: "Amount", value: `${amount || "0"} ${selected.symbol}` },
      { label: "From", value: depositMethod },
      { label: "You receive", value: `${amount || "0"} ${selected.symbol}` },
      { label: "Network fee", value: `~0.01 ${selected.symbol}` },
    ],
    [amount, depositMethod, selected.symbol]
  );

  const openDepositModal = () => {
    if (mode !== "deposit" || !amount || Number(amount) <= 0) return;
    setModalPhase("confirm");
    setModalOpen(true);
  };

  const handleConfirm = () => {
    setModalPhase("success");
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalPhase("confirm");
    if (modalPhase === "success") {
      router.push("/home");
    }
  };

  return (
    <>
      <header className="flex items-center px-5 pb-3 pt-5">
        <Link href={backHref} className="icon-btn" aria-label="Back">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-center text-[1.05rem] font-bold">{title}</h1>
        <span className="w-10" />
      </header>

      <div className="screen px-5 pb-8">
        <p className="text-sm text-muted">{subtitle}</p>

        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Asset
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WALLET_ASSETS.map((item) => (
              <button
                key={item.symbol}
                type="button"
                className={`asset-chip ${asset === item.symbol ? "asset-chip-active" : ""}`}
                onClick={() => setAsset(item.symbol)}
              >
                <TokenIcon src={item.logo} alt={item.symbol} size={24} />
                <span>{item.symbol}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Amount
          </p>
          <div className="amount-field mt-2">
            <TokenIcon src={selected.logo} alt={selected.symbol} size={36} />
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="amount-field-input"
            />
            <span className="text-sm font-semibold text-soft">{selected.code}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className="chip"
                onClick={() => setAmount(String(value))}
              >
                {value} {selected.symbol}
              </button>
            ))}
          </div>
        </section>

        {mode === "deposit" ? (
          <section className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              From
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {DEPOSIT_METHODS.map((method) => (
                <label key={method} className="method-row">
                  <input
                    type="radio"
                    name="deposit-method"
                    checked={depositMethod === method}
                    onChange={() => setDepositMethod(method)}
                    className="accent-brand-500"
                  />
                  <span className="font-semibold text-ink">{method}</span>
                </label>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              To
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <label className="method-row">
                <input type="radio" name="withdraw-method" defaultChecked className="accent-brand-500" />
                <span className="font-semibold text-ink">Linked bank account</span>
              </label>
              <label className="method-row">
                <input type="radio" name="withdraw-method" className="accent-brand-500" />
                <span className="font-semibold text-ink">External wallet</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="0x… or account number"
              className="search-field mt-3 w-full"
            />
          </section>
        )}

        <div className="summary-card mt-8">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">You {mode === "deposit" ? "receive" : "send"}</span>
            <span className="flex items-center gap-2 tnum font-bold text-ink">
              {amount || "0"} {selected.symbol}
              <TokenIcon src={selected.logo} alt={selected.symbol} size={22} />
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted">Network fee (est.)</span>
            <span className="tnum font-semibold text-muted">~0.01 {selected.symbol}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-gradient btn-block mt-6"
          onClick={mode === "deposit" ? openDepositModal : undefined}
        >
          {actionLabel}
        </button>
      </div>

      {mode === "deposit" && (
        <ConfirmationModal
          open={modalOpen}
          variant="deposit"
          phase={modalPhase}
          details={modalDetails}
          onConfirm={handleConfirm}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
