import { explorerTxUrl } from "./api";

export type ReceiptInput = {
  receiptId: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency?: string;
  recipientReceives?: number;
  recipientName?: string;
  txHash?: string;
  savings?: string;
};

export function buildReceiptText(input: ReceiptInput): string {
  const lines = [
    "Remifi transfer receipt",
    "—",
    `Receipt: ${input.receiptId}`,
    `Amount: ${input.amount} ${input.sourceCurrency}`,
  ];
  if (input.recipientName) lines.push(`To: ${input.recipientName}`);
  if (
    input.recipientReceives != null &&
    input.destinationCurrency
  ) {
    lines.push(
      `They receive: ~${input.recipientReceives.toFixed(2)} ${input.destinationCurrency}`
    );
  }
  if (input.savings) lines.push(input.savings);
  if (input.txHash) {
    lines.push(`Tx: ${input.txHash}`);
    lines.push(`Explorer: ${explorerTxUrl(input.txHash)}`);
  }
  lines.push("", "Sent via Remifi on Celo · remifi.xyz");
  return lines.join("\n");
}

export async function shareReceipt(input: ReceiptInput): Promise<"shared" | "copied"> {
  const text = buildReceiptText(input);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Remifi receipt",
        text,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
