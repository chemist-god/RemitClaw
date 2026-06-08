import { formatUnits, type Address } from "viem";
import type { Config } from "../config/index.js";
import type { RemittanceIntent } from "../types/index.js";
import { parseRemittanceIntent } from "../intent/parser.js";
import { prepareTransfer } from "../transfers/executor.js";
import { compareFees, formatSavings } from "../fees/comparison.js";
import { scheduleRecurringTransfer } from "../transfers/scheduler.js";
import { RemitClawAgent } from "../agent/remitclaw-agent.js";
import { loadTransactions } from "../history/store.js";
import { CELO_MAINNET_TOKENS } from "../mento/client.js";
import { getAgentAccount, getTokenBalance } from "../wallet/client.js";

export interface QuoteResult {
  kind: "quote" | "schedule";
  intent: RemittanceIntent;
  summary: string;
  savings?: string;
  needsConfirmation?: boolean;
  recipientReceives?: number;
  destinationCurrency?: string;
  mentoFeeUsd?: number;
  estimatedGasUsd?: number;
  routeHops?: number;
  mentoPair?: string;
  scheduleNextRunAt?: string;
}

export interface ExecuteResult {
  status: "confirmed" | "failed";
  receiptId: string;
  txHash?: string;
  recipientReceives: number;
  destinationCurrency: string;
  summary: string;
  savings: string;
}

/** Parse a message and (for one-time sends) attach a live Mento quote + fee comparison. */
export async function quoteForMessage(
  config: Config,
  message: string
): Promise<QuoteResult> {
  const intent = parseRemittanceIntent(message);

  if (intent.frequency !== "once") {
    const schedule = scheduleRecurringTransfer(config.dataDir, intent);
    return {
      kind: "schedule",
      intent,
      summary: `Scheduled ${intent.frequency} transfer of ${intent.amount} ${intent.sourceCurrency} to ${intent.destinationCountry}. Next run: ${schedule.nextRunAt}`,
      scheduleNextRunAt: schedule.nextRunAt,
    };
  }

  const { corridor, quote, needsConfirmation } = await prepareTransfer(
    config,
    intent
  );

  const corridorKey = `${corridor.sourceCurrency}-${corridor.destinationCountry.slice(0, 2)}`;
  const recipientReceives = Number(formatUnits(quote.amountOut, 18));
  const comparisons = compareFees(
    corridorKey,
    intent.amount,
    quote.mentoFeeUsd,
    recipientReceives
  );
  const savings = formatSavings(comparisons);

  const summary = [
    `Route: ${corridor.mentoPair} (${quote.routeHops} hop${quote.routeHops === 1 ? "" : "s"})`,
    `Send: ${intent.amount} ${intent.sourceCurrency}`,
    `Recipient receives: ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency}`,
    `Mento fee: ~$${quote.mentoFeeUsd.toFixed(2)} | Gas: ~$${quote.estimatedGasUsd.toFixed(4)}`,
    savings,
  ].join("\n");

  return {
    kind: "quote",
    intent,
    summary,
    savings,
    needsConfirmation,
    recipientReceives,
    destinationCurrency: corridor.destinationCurrency,
    mentoFeeUsd: quote.mentoFeeUsd,
    estimatedGasUsd: quote.estimatedGasUsd,
    routeHops: quote.routeHops,
    mentoPair: corridor.mentoPair,
  };
}

/**
 * Execute a transfer derived from a natural-language message.
 *
 * `recipientWallet` overrides the parsed intent; if neither is present the
 * configured demo recipient is used so the agent can still produce a real tx.
 */
export async function executeForMessage(
  config: Config,
  message: string,
  recipientWallet?: string
): Promise<ExecuteResult> {
  const intent = parseRemittanceIntent(message);
  const recipient =
    recipientWallet || intent.recipientWallet || config.demoRecipientAddress;

  if (!recipient) {
    throw new Error(
      "No recipient wallet. Provide recipientWallet or set DEMO_RECIPIENT_ADDRESS."
    );
  }
  intent.recipientWallet = recipient;

  const { corridor, quote } = await prepareTransfer(config, intent);
  const corridorKey = `${corridor.sourceCurrency}-${corridor.destinationCountry.slice(0, 2)}`;
  const recipientReceives = Number(formatUnits(quote.amountOut, 18));
  const comparisons = compareFees(
    corridorKey,
    intent.amount,
    quote.mentoFeeUsd,
    recipientReceives
  );

  const agent = new RemitClawAgent(config);
  const record = await agent.executeTransfer(intent, corridor, quote, comparisons);

  return {
    status: record.status === "confirmed" ? "confirmed" : "failed",
    receiptId: record.id,
    txHash: record.txHash,
    recipientReceives,
    destinationCurrency: corridor.destinationCurrency,
    summary: `Sent ${intent.amount} ${intent.sourceCurrency} → ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency}`,
    savings: formatSavings(comparisons),
  };
}

/**
 * The agent's own on-chain address (Model A wallet). Returned to the web app so
 * it can show real balances before per-user wallets land in Phase 3.
 */
export function getAgentAddress(config: Config): string | null {
  if (!config.agentPrivateKey) return null;
  try {
    return getAgentAccount(config).address;
  } catch {
    return null;
  }
}

export interface HistoryItem {
  id: string;
  status: string;
  amount: number;
  sourceCurrency: string;
  destinationCountry: string;
  recipientName?: string;
  txHash?: string;
  createdAt: string;
}

export function getHistory(config: Config): HistoryItem[] {
  return loadTransactions(config.dataDir)
    .map((r) => ({
      id: r.id,
      status: r.status,
      amount: r.intent.amount,
      sourceCurrency: r.intent.sourceCurrency,
      destinationCountry: r.intent.destinationCountry,
      recipientName: r.intent.recipientName,
      txHash: r.txHash,
      createdAt: r.createdAt,
    }))
    .reverse();
}

export interface BalanceItem {
  symbol: string;
  address: string;
  balance: number;
}

/** Read on-chain stablecoin balances for an address across the known Celo tokens. */
export async function getBalances(
  config: Config,
  address: string
): Promise<BalanceItem[]> {
  const tokens: Array<{ symbol: string; address: string }> = [
    { symbol: "USDm", address: CELO_MAINNET_TOKENS.USDm },
    { symbol: "EURm", address: CELO_MAINNET_TOKENS.EURm },
    { symbol: "BRLm", address: CELO_MAINNET_TOKENS.BRLm },
  ];

  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        const raw = await getTokenBalance(
          config,
          token.address as Address,
          address as Address
        );
        return {
          symbol: token.symbol,
          address: token.address,
          balance: Number(formatUnits(raw, 18)),
        };
      } catch {
        return { symbol: token.symbol, address: token.address, balance: 0 };
      }
    })
  );

  return results;
}
