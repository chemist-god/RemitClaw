import type { FeeComparison } from "../types/index.js";

/** Approximate fee tables for demo comparisons — replace with live API data in production */
const TRADITIONAL_FEES: Record<
  string,
  { westernUnion: number; wise: number }
> = {
  "USD-PH": { westernUnion: 0.045, wise: 0.012 },
  "EUR-NG": { westernUnion: 0.05, wise: 0.015 },
  "GBP-KE": { westernUnion: 0.048, wise: 0.013 },
};

export function compareFees(
  corridorKey: string,
  sendAmountUsd: number,
  mentoFeeUsd: number,
  recipientReceivesMento: number
): FeeComparison[] {
  const rates = TRADITIONAL_FEES[corridorKey] ?? {
    westernUnion: 0.05,
    wise: 0.015,
  };

  const wuFee = sendAmountUsd * rates.westernUnion;
  const wiseFee = sendAmountUsd * rates.wise;

  return [
    {
      provider: "mento",
      sendAmountUsd,
      feeUsd: mentoFeeUsd,
      recipientReceives: recipientReceivesMento,
      effectiveRate: recipientReceivesMento / sendAmountUsd,
    },
    {
      provider: "western_union",
      sendAmountUsd,
      feeUsd: wuFee,
      recipientReceives: sendAmountUsd - wuFee,
      effectiveRate: (sendAmountUsd - wuFee) / sendAmountUsd,
    },
    {
      provider: "wise",
      sendAmountUsd,
      feeUsd: wiseFee,
      recipientReceives: sendAmountUsd - wiseFee,
      effectiveRate: (sendAmountUsd - wiseFee) / sendAmountUsd,
    },
  ];
}

export function formatSavings(comparisons: FeeComparison[]): string {
  const mento = comparisons.find((c) => c.provider === "mento");
  const wu = comparisons.find((c) => c.provider === "western_union");
  if (!mento || !wu) return "";

  const savings = wu.feeUsd - mento.feeUsd;
  const pct = ((savings / wu.feeUsd) * 100).toFixed(0);
  return `You save ~$${savings.toFixed(2)} (${pct}%) vs Western Union on fees alone.`;
}
