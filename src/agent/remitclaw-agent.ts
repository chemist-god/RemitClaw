import type { Config } from "../config/index.js";
import type { RemittanceIntent, TransferRecord } from "../types/index.js";
import { parseRemittanceIntent } from "../intent/parser.js";
import { compareFees, formatSavings } from "../fees/comparison.js";
import { prepareTransfer } from "../transfers/executor.js";
import { scheduleRecurringTransfer } from "../transfers/scheduler.js";
import { saveTransaction } from "../history/store.js";
import { notifyRecipient } from "../notifications/twilio.js";
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
      return {
        message: `${summary}\n\nConfirm to proceed? (amount exceeds $${this.config.requireConfirmationAboveUsd} threshold)`,
        intent,
        needsConfirmation: true,
      };
    }

    const record = await this.executeTransfer(intent, comparisons);
    return {
      message: `${summary}\n\nTransfer submitted. Receipt ID: ${record.id}`,
      intent,
      record,
    };
  }

  async executeTransfer(
    intent: RemittanceIntent,
    feeComparison?: ReturnType<typeof compareFees>
  ): Promise<TransferRecord> {
    const record: TransferRecord = {
      id: crypto.randomUUID(),
      intent,
      status: "pending",
      createdAt: new Date().toISOString(),
      feeComparison,
    };

    // On-chain execution: wire up Mento swap + wallet client here
    // record.txHash = await executeMentoSwap(...)

    record.status = "confirmed";
    record.confirmedAt = new Date().toISOString();
    saveTransaction(this.config.dataDir, record);

    await notifyRecipient(this.config, intent, record.txHash);
    return record;
  }
}
