import type { Address } from "viem";
import type { Config } from "../config/index.js";
import type { Corridor, RemittanceIntent, RouteQuote, TransferRecord } from "../types/index.js";
import { parseRemittanceIntent } from "../intent/parser.js";
import { compareFees, formatSavings } from "../fees/comparison.js";
import { prepareTransfer } from "../transfers/executor.js";
import { scheduleRecurringTransfer } from "../transfers/scheduler.js";
import { saveTransaction } from "../history/store.js";
import { notifyRecipient } from "../notifications/twilio.js";
import { executeRemittance } from "../transfers/onchain.js";
import { formatUnits } from "viem";

export interface AgentResponse {
  message: string;
  intent?: RemittanceIntent;
  record?: TransferRecord;
  needsConfirmation?: boolean;
}

export class RemitClawAgent {
  constructor(private readonly config: Config) {}

  async handleMessage(userMessage: string): Promise<AgentResponse> {
    const intent = parseRemittanceIntent(userMessage);

    if (intent.frequency !== "once") {
      const schedule = scheduleRecurringTransfer(this.config.dataDir, intent);
      return {
        message: `Scheduled ${intent.frequency} transfer of ${intent.amount} ${intent.sourceCurrency} to ${intent.destinationCountry}. Next run: ${schedule.nextRunAt}`,
        intent,
      };
    }

    const { corridor, quote, needsConfirmation } = await prepareTransfer(
      this.config,
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

    if (needsConfirmation) {
      const walletHint = this.resolveRecipientWallet(intent)
        ? `\nRecipient: ${this.truncateAddress(this.resolveRecipientWallet(intent)!)}`
        : "\nProvide recipient wallet (0x…) or set DEMO_RECIPIENT_ADDRESS before confirming.";
      return {
        message: `${summary}${walletHint}\n\nConfirm to proceed? (amount exceeds $${this.config.requireConfirmationAboveUsd} threshold)`,
        intent,
        needsConfirmation: true,
      };
    }

    const recipient = this.resolveRecipientWallet(intent);
    if (!recipient) {
      return {
        message: `${summary}\n\nCannot execute yet — no recipient wallet. Send the 0x address or set DEMO_RECIPIENT_ADDRESS in .env.`,
        intent,
      };
    }
    intent.recipientWallet = recipient;

    const record = await this.executeTransfer(intent, corridor, quote, comparisons);
    const txLine = record.txHash
      ? `\nTx: ${record.txHash}`
      : "";
    return {
      message: `${summary}\n\nTransfer ${record.status}. Receipt ID: ${record.id}${txLine}`,
      intent,
      record,
    };
  }

  async executeTransfer(
    intent: RemittanceIntent,
    corridor: Corridor,
    quote: RouteQuote,
    feeComparison?: ReturnType<typeof compareFees>
  ): Promise<TransferRecord> {
    const record: TransferRecord = {
      id: crypto.randomUUID(),
      intent,
      status: "pending",
      createdAt: new Date().toISOString(),
      feeComparison,
    };

    if (!intent.recipientWallet) {
      const fallback = this.resolveRecipientWallet(intent);
      if (fallback) intent.recipientWallet = fallback;
    }

    if (!intent.recipientWallet) {
      record.status = "failed";
      saveTransaction(this.config.dataDir, record);
      throw new Error(
        "No recipient wallet address. Add the recipient's 0x address (or use the claim flow) before sending."
      );
    }

    try {
      const result = await executeRemittance(
        this.config,
        corridor,
        quote,
        intent.recipientWallet as Address
      );
      record.txHash = result.txHash;
      record.status = "confirmed";
      record.confirmedAt = new Date().toISOString();
    } catch (err) {
      record.status = "failed";
      saveTransaction(this.config.dataDir, record);
      throw err;
    }

    saveTransaction(this.config.dataDir, record);
    await notifyRecipient(this.config, intent, record.txHash);
    return record;
  }

  /** Demo recipient or explicit wallet from the parsed intent. */
  private resolveRecipientWallet(intent: RemittanceIntent): string | undefined {
    return intent.recipientWallet || this.config.demoRecipientAddress;
  }

  private truncateAddress(address: string): string {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
}
