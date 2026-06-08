"use client";

import { useState } from "react";
import { buildReceiptText, shareReceipt, type ReceiptInput } from "../lib/receipt";
import { explorerTxUrl } from "../lib/api";

type TxReceiptShareProps = {
  receipt: ReceiptInput;
  explorerLabel?: string;
  shareLabel?: string;
  copiedLabel?: string;
};

export function TxReceiptShare({
  receipt,
  explorerLabel = "View on explorer ↗",
  shareLabel = "Share receipt",
  copiedLabel = "Copied!",
}: TxReceiptShareProps) {
  const [status, setStatus] = useState<"idle" | "copied">("idle");

  const handleShare = async () => {
    try {
      const result = await shareReceipt(receipt);
      if (result === "copied") {
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      /* user cancelled share sheet */
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {receipt.txHash ? (
        <a
          href={explorerTxUrl(receipt.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-700 underline underline-offset-2"
        >
          {explorerLabel}
        </a>
      ) : null}
      <button
        type="button"
        className="text-xs font-semibold text-brand-700 underline underline-offset-2"
        onClick={() => void handleShare()}
      >
        {status === "copied" ? copiedLabel : shareLabel}
      </button>
      <span className="sr-only">{buildReceiptText(receipt)}</span>
    </div>
  );
}
