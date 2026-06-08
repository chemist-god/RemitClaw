#!/usr/bin/env node
/**
 * Unified Remifi CLI for OpenClaw exec — always prints JSON.
 *
 * Usage:
 *   npx tsx src/cli/remifi.ts quote "Send $5 to Mom in the Philippines"
 *   npx tsx src/cli/remifi.ts send "Send $5 to Mom in the Philippines" --yes
 *   npx tsx src/cli/remifi.ts send "..." --to-wallet 0xRecipient --yes
 *   npx tsx src/cli/remifi.ts balance
 *   npx tsx src/cli/remifi.ts history
 *   npx tsx src/cli/remifi.ts health
 */
import { loadConfig } from "../config/index.js";
import {
  executeForMessage,
  getAgentAddress,
  getBalances,
  getHistory,
  quoteForMessage,
} from "../api/service.js";

interface Args {
  command?: string;
  message?: string;
  toWallet?: string;
  yes: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { yes: false };
  const messageParts: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!args.command && !a.startsWith("-")) {
      args.command = a;
      continue;
    }
    if (a === "--to-wallet" && argv[i + 1]) args.toWallet = argv[++i];
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (a === "--message" && argv[i + 1]) args.message = argv[++i];
    else messageParts.push(a);
  }

  if (!args.message && messageParts.length) {
    args.message = messageParts.join(" ");
  }
  return args;
}

function ok(data: unknown) {
  console.log(JSON.stringify({ ok: true, ...((data as object) ?? {}) }, null, 2));
}

function fail(error: string, extra?: Record<string, unknown>) {
  console.log(JSON.stringify({ ok: false, error, ...extra }, null, 2));
  process.exit(1);
}

async function main() {
  const args = parseArgs();
  const config = loadConfig();

  switch (args.command) {
    case "health": {
      ok({
        chainId: config.celoChainId,
        executionReady: Boolean(config.agentPrivateKey),
        agentAddress: getAgentAddress(config),
        demoRecipient: config.demoRecipientAddress ?? null,
        apiPort: config.agentApiPort,
      });
      return;
    }

    case "balance": {
      const address = getAgentAddress(config);
      if (!address) fail("AGENT_PRIVATE_KEY not set — cannot read agent balance.");
      const items = await getBalances(config, address);
      ok({ address, items });
      return;
    }

    case "history": {
      ok({ items: getHistory(config) });
      return;
    }

    case "quote": {
      if (!args.message) fail('Usage: remifi quote "Send $5 to Mom in the Philippines"');
      const quote = await quoteForMessage(config, args.message);
      ok({ quote });
      return;
    }

    case "send": {
      if (!args.message) {
        fail('Usage: remifi send "Send $5 to Mom in the Philippines" [--to-wallet 0x…] [--yes]');
      }
      const quote = await quoteForMessage(config, args.message);
      if (quote.needsConfirmation && !args.yes) {
        ok({
          status: "needs_confirmation",
          quote,
          hint: `Re-run with --yes to execute (threshold $${config.requireConfirmationAboveUsd}).`,
        });
        return;
      }
      const result = await executeForMessage(
        config,
        args.message,
        args.toWallet
      );
      ok({ result, explorerUrl: result.txHash ? `https://celoscan.io/tx/${result.txHash}` : null });
      return;
    }

    default:
      fail("Unknown command. Use: quote | send | balance | history | health");
  }
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
});
