import { formatUnits, type Address } from "viem";
import type { Config } from "../config/index.js";
import type { RemittanceIntent } from "../types/index.js";
import { parseRemittanceIntent } from "../intent/parser.js";
import { prepareTransfer, getSpendingLimits } from "../transfers/executor.js";
import { compareFees, formatSavings } from "../fees/comparison.js";
import {
  cancelSchedule,
  listSchedules,
  scheduleRecurringTransfer,
  setScheduleActive,
  type ScheduleEntry,
} from "../transfers/scheduler.js";
import { RemitClawAgent } from "../agent/remitclaw-agent.js";
import { loadTransactions, saveTransaction } from "../history/store.js";
import { CELO_MAINNET_TOKENS, loadCorridors } from "../mento/client.js";
import { getAgentAccount, getTokenBalance } from "../wallet/client.js";
import { resolveContactContext } from "../contacts/resolve.js";
import {
  findContactByName,
  findContactByPhone,
  importPhoneContacts,
  loadContacts,
  syncContacts,
  upsertContact,
  deleteContact,
} from "../contacts/store.js";
import type { PhoneImportEntry } from "../contacts/types.js";
import type { StoredContact } from "../contacts/types.js";
import { executeEscrowRemittance, readEscrow, vaultConfigured } from "../escrow/client.js";
import { notifyClaimLink } from "../notifications/twilio.js";
import { executeRemittance } from "../transfers/onchain.js";

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
  deliveryMethod?: "wallet" | "escrow";
  matchedContact?: string;
  /** Live Mento implied rate: destination units per 1 source unit. */
  exchangeRate?: number;
}

export interface ExecuteResult {
  status: "confirmed" | "failed";
  receiptId: string;
  txHash?: string;
  recipientReceives: number;
  destinationCurrency: string;
  summary: string;
  savings: string;
  deliveryMethod?: "wallet" | "escrow";
  claimUrl?: string;
  notificationSent?: boolean;
}

/** Optional contact fields from the web app (override parsed intent). */
export interface TransferContext {
  destinationCountry?: string;
  recipientWallet?: string;
  recipientPhone?: string;
  /** WhatsApp / channel sender — used to match contacts by phone. */
  senderPhone?: string;
}

function applyTransferContext(
  intent: RemittanceIntent,
  ctx?: TransferContext
): RemittanceIntent {
  if (!ctx) return intent;
  return {
    ...intent,
    destinationCountry: ctx.destinationCountry ?? intent.destinationCountry,
    recipientWallet: ctx.recipientWallet ?? intent.recipientWallet,
    recipientPhone: ctx.recipientPhone ?? intent.recipientPhone,
  };
}

/** Merge parsed intent with saved contacts and explicit caller context. */
export function resolveIntent(
  config: Config,
  message: string,
  ctx?: TransferContext
): { intent: RemittanceIntent; matchedContact?: string } {
  const parsed = parseRemittanceIntent(message);
  const contactCtx = resolveContactContext(
    config.dataDir,
    parsed.recipientName,
    ctx?.senderPhone
  );
  const matched =
    findContactByName(config.dataDir, parsed.recipientName ?? "") ??
    (ctx?.senderPhone
      ? findContactByPhone(config.dataDir, ctx.senderPhone)
      : undefined);
  const matchedContact = matched?.name;

  let intent = applyTransferContext(parsed, contactCtx);
  intent = applyTransferContext(intent, ctx);
  return { intent, matchedContact };
}

function deliveryHint(intent: RemittanceIntent, config: Config): {
  method: "wallet" | "escrow" | "demo" | "missing";
} {
  if (intent.recipientWallet) return { method: "wallet" };
  if (intent.recipientPhone && vaultConfigured(config)) return { method: "escrow" };
  if (config.demoRecipientAddress) return { method: "demo" };
  return { method: "missing" };
}

/** Parse a message and (for one-time sends) attach a live Mento quote + fee comparison. */
export async function quoteForMessage(
  config: Config,
  message: string,
  ctx?: TransferContext
): Promise<QuoteResult> {
  const { intent, matchedContact } = resolveIntent(config, message, ctx);

  if (intent.frequency !== "once") {
    const schedule = scheduleRecurringTransfer(config.dataDir, intent);
    return {
      kind: "schedule",
      intent,
      summary: `Scheduled ${intent.frequency} transfer of ${intent.amount} ${intent.sourceCurrency} to ${intent.destinationCountry}. Next run: ${schedule.nextRunAt}`,
      scheduleNextRunAt: schedule.nextRunAt,
      matchedContact,
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
  const delivery = deliveryHint(intent, config);

  const deliveryLine =
    delivery.method === "escrow"
      ? "Delivery: claim link via SMS/WhatsApp (phone on file)"
      : delivery.method === "wallet"
        ? "Delivery: direct to wallet on file"
        : delivery.method === "demo"
          ? "Delivery: demo wallet (add phone or wallet on contact)"
          : "Delivery: add a wallet or phone on the contact to continue";

  const summary = [
    `Route: ${corridor.mentoPair} (${quote.routeHops} hop${quote.routeHops === 1 ? "" : "s"})`,
    `Send: ${intent.amount} ${intent.sourceCurrency}`,
    `Recipient receives: ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency}`,
    `Mento fee: ~$${quote.mentoFeeUsd.toFixed(2)} | Gas: ~$${quote.estimatedGasUsd.toFixed(4)}`,
    deliveryLine,
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
    deliveryMethod:
      delivery.method === "escrow"
        ? "escrow"
        : delivery.method === "wallet"
          ? "wallet"
          : undefined,
    matchedContact,
    exchangeRate:
      intent.amount > 0 ? recipientReceives / intent.amount : undefined,
  };
}

export function getSchedules(config: Config): ScheduleEntry[] {
  return listSchedules(config.dataDir);
}

export function removeSchedule(config: Config, id: string): boolean {
  return cancelSchedule(config.dataDir, id);
}

export function toggleSchedule(
  config: Config,
  id: string,
  active: boolean
): ScheduleEntry | null {
  return setScheduleActive(config.dataDir, id, active);
}

/**
 * Execute a transfer derived from a natural-language message.
 * Wallet → direct on-chain send. Phone only → escrow vault + claim link.
 */
export async function executeForMessage(
  config: Config,
  message: string,
  ctx?: TransferContext
): Promise<ExecuteResult> {
  const { intent } = resolveIntent(config, message, ctx);
  const { corridor, quote } = await prepareTransfer(config, intent);
  const corridorKey = `${corridor.sourceCurrency}-${corridor.destinationCountry.slice(0, 2)}`;
  const recipientReceives = Number(formatUnits(quote.amountOut, 18));
  const comparisons = compareFees(
    corridorKey,
    intent.amount,
    quote.mentoFeeUsd,
    recipientReceives
  );
  const savings = formatSavings(comparisons);

  const delivery = deliveryHint(intent, config);

  if (delivery.method === "escrow" && intent.recipientPhone) {
    const escrow = await executeEscrowRemittance(
      config,
      corridor,
      quote,
      intent.recipientPhone
    );

    const record = {
      id: crypto.randomUUID(),
      intent: { ...intent, recipientPhone: intent.recipientPhone },
      txHash: escrow.txHash,
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      feeComparison: comparisons,
      deliveryMethod: "escrow" as const,
      claimId: escrow.claim.claimId,
      claimUrl: escrow.claim.claimUrl,
    };
    saveTransaction(config.dataDir, record);

    const notification = await notifyClaimLink(
      config,
      intent,
      escrow.claim.claimUrl,
      recipientReceives,
      corridor.destinationCurrency
    );

    return {
      status: "confirmed",
      receiptId: record.id,
      txHash: escrow.txHash,
      recipientReceives,
      destinationCurrency: corridor.destinationCurrency,
      summary: `Sent ${intent.amount} ${intent.sourceCurrency} → ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency} (claim link)`,
      savings,
      deliveryMethod: "escrow",
      claimUrl: escrow.claim.claimUrl,
      notificationSent: Boolean(notification?.sid),
    };
  }

  const recipient =
    intent.recipientWallet || config.demoRecipientAddress;

  if (!recipient) {
    throw new Error(
      "No recipient wallet or phone. Save a contact with a phone number (for claim escrow) or wallet address."
    );
  }
  intent.recipientWallet = recipient;

  const agent = new RemitClawAgent(config);
  const record = await agent.executeTransfer(intent, corridor, quote, comparisons);

  return {
    status: record.status === "confirmed" ? "confirmed" : "failed",
    receiptId: record.id,
    txHash: record.txHash,
    recipientReceives,
    destinationCurrency: corridor.destinationCurrency,
    summary: `Sent ${intent.amount} ${intent.sourceCurrency} → ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency}`,
    savings,
    deliveryMethod: "wallet",
  };
}

export function listContacts(config: Config): StoredContact[] {
  return loadContacts(config.dataDir);
}

export function getContactByName(
  config: Config,
  name: string
): StoredContact | undefined {
  return findContactByName(config.dataDir, name);
}

export function saveContact(
  config: Config,
  contact: StoredContact
): StoredContact {
  return upsertContact(config.dataDir, contact);
}

export function bulkSyncContacts(
  config: Config,
  contacts: StoredContact[]
): StoredContact[] {
  return syncContacts(config.dataDir, contacts);
}

/** Import device address-book entries into the agent contact store. */
export function importContactsFromPhone(
  config: Config,
  entries: PhoneImportEntry[]
): StoredContact[] {
  return importPhoneContacts(config.dataDir, entries);
}

export function removeContact(config: Config, id: string): boolean {
  return deleteContact(config.dataDir, id);
}

export async function getClaimInfo(config: Config, claimId: string) {
  return readEscrow(config, claimId as `0x${string}`);
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

export type ProfileCorridor = {
  id: string;
  sourceCurrency: string;
  destinationCurrency: string;
  destinationCountry: string;
  label: string;
};

export function getProfileInfo(config: Config) {
  const limits = getSpendingLimits(config);
  const corridors: ProfileCorridor[] = loadCorridors(config.dataDir).map((c) => ({
    id: c.id,
    sourceCurrency: c.sourceCurrency,
    destinationCurrency: c.destinationCurrency,
    destinationCountry: c.destinationCountry,
    label: `${c.sourceCurrency}m → ${c.destinationCurrency}`,
  }));

  return {
    limits: {
      dailyLimitUsd: limits.dailyLimitUsd,
      singleTransferLimitUsd: limits.singleTransferLimitUsd,
      dailySpentUsd: limits.dailySpentUsd,
      confirmationThresholdUsd: limits.confirmationThresholdUsd,
    },
    corridors,
    defaultCorridorId: corridors[0]?.id ?? "usd-php",
  };
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
  deliveryMethod?: string;
  claimUrl?: string;
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
      deliveryMethod: r.deliveryMethod,
      claimUrl: r.claimUrl,
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
    { symbol: "PHPm", address: CELO_MAINNET_TOKENS.PHPm },
    { symbol: "NGNm", address: CELO_MAINNET_TOKENS.NGNm },
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
