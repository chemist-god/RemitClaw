#!/usr/bin/env node
import { formatUnits } from "viem";
import { loadConfig } from "../config/index.js";
import { parseRemittanceIntent } from "../intent/parser.js";
import { prepareTransfer } from "../transfers/executor.js";
import { compareFees, formatSavings } from "../fees/comparison.js";
import { RemitClawAgent } from "../agent/remitclaw-agent.js";
import type { RemittanceIntent } from "../types/index.js";

interface Args {
  message?: string;
  from?: string;
  toCountry?: string;
  amount?: number;
  toWallet?: string;
  yes: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { yes: false };
  const message: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from" && argv[i + 1]) args.from = argv[++i].toUpperCase();
    else if (a === "--to-country" && argv[i + 1]) args.toCountry = argv[++i].toUpperCase();
    else if (a === "--amount" && argv[i + 1]) args.amount = parseFloat(argv[++i]);
    else if (a === "--to-wallet" && argv[i + 1]) args.toWallet = argv[++i];
    else if (a === "--message" && argv[i + 1]) args.message = argv[++i];
    else if (a === "--yes" || a === "-y") args.yes = true;
    else message.push(a);
  }

  if (!args.message && message.length) args.message = message.join(" ");
  return args;
}

function usage(): never {
  console.error(
    [
      "Usage:",
      '  npx tsx src/cli/send.ts "Send $5 to Mom in the Philippines" --to-wallet 0xRecipient',
      "  npx tsx src/cli/send.ts --from USD --to-country PH --amount 5 --to-wallet 0xRecipient",
      "",
      "Flags:",
      "  --to-wallet 0x...   Recipient Celo address (required for on-chain send)",
      "  --message \"...\"      Natural-language request (EN/ES/PT/FR)",
      "  --from USD          Source currency (with --to-country/--amount)",
      "  --to-country PH     Destination country code",
      "  --amount 5          Amount to send",
      "  --yes, -y           Skip the confirmation prompt for high-value transfers",
    ].join("\n")
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs();
  const config = loadConfig();

  if (!args.toWallet) {
    console.error("Error: --to-wallet is required for on-chain execution.\n");
    usage();
  }

  // Build the remittance intent from either a message or explicit flags.
  let intent: RemittanceIntent;
  if (args.message) {
    intent = parseRemittanceIntent(args.message);
  } else if (args.from && args.toCountry && args.amount) {
    intent = {
      locale: "en",
      amount: args.amount,
      sourceCurrency: args.from,
      destinationCountry: args.toCountry,
      frequency: "once",
      rawMessage: `Send ${args.amount} ${args.from} to ${args.toCountry}`,
    } as RemittanceIntent;
  } else {
    usage();
  }

  intent.recipientWallet = args.toWallet;

  const { corridor, quote, needsConfirmation } = await prepareTransfer(config, intent);
  const recipientReceives = Number(formatUnits(quote.amountOut, 18));
  const corridorKey = `${corridor.sourceCurrency}-${corridor.destinationCountry.slice(0, 2)}`;
  const comparisons = compareFees(corridorKey, intent.amount, quote.mentoFeeUsd, recipientReceives);

  console.log("\n--- Remittance ---");
  console.log(`Route:     ${corridor.mentoPair} (${quote.routeHops} hop${quote.routeHops === 1 ? "" : "s"})`);
  console.log(`Send:      ${intent.amount} ${intent.sourceCurrency}`);
  console.log(`Receives:  ~${recipientReceives.toFixed(2)} ${corridor.destinationCurrency}`);
  console.log(`To:        ${args.toWallet}`);
  console.log(formatSavings(comparisons));

  if (needsConfirmation && !args.yes) {
    console.log(
      `\nThis transfer exceeds the $${config.requireConfirmationAboveUsd} confirmation threshold.`
    );
    console.log("Re-run with --yes to confirm and execute.");
    process.exit(0);
  }

  const agent = new RemitClawAgent(config);
  const record = await agent.executeTransfer(intent, corridor, quote, comparisons);

  console.log("\n--- Result ---");
  console.log(`Status:    ${record.status}`);
  console.log(`Receipt:   ${record.id}`);
  if (record.txHash) console.log(`Tx hash:   ${record.txHash}`);
}

main().catch((err) => {
  console.error("\nSend failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
