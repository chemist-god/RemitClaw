#!/usr/bin/env node
import { loadConfig } from "../config/index.js";
import { getAgentAccount } from "../wallet/client.js";
import { buildAgentCard, resolveAgentUri } from "../agent/agent-card.js";
import { getAgentWallet, registerAgent } from "../agent/register.js";

interface Args {
  uri?: string;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--uri" && argv[i + 1]) args.uri = argv[++i];
    else if (a === "--dry-run" || a === "-n") args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const config = loadConfig();

  if (!config.agentPrivateKey) {
    console.error(
      "Error: AGENT_PRIVATE_KEY is required to register on ERC-8004."
    );
    process.exit(1);
  }

  const account = getAgentAccount(config);
  const agentUri = args.uri ?? resolveAgentUri(config);
  const card = buildAgentCard(config, account.address);

  console.log("\n--- ERC-8004 registration ---");
  console.log(`Registry:  ${config.identityRegistryAddress}`);
  console.log(`Chain:     ${config.celoChainId}`);
  console.log(`Owner:     ${account.address}`);
  console.log(`Agent URI: ${truncate(agentUri, 96)}`);
  console.log("\nAgent card:");
  console.log(JSON.stringify(card, null, 2));

  if (args.dryRun) {
    console.log("\n(dry run — no transaction sent)");
    return;
  }

  console.log("\nSubmitting register() transaction…");
  const result = await registerAgent(config, agentUri);
  const wallet = await getAgentWallet(config, result.agentId).catch(() => null);

  console.log("\n--- Registered ---");
  console.log(`Agent ID:  ${result.agentId}`);
  console.log(`Tx:        ${result.explorerUrl}`);
  console.log(`Registry:  ${result.agentRegistry}`);
  if (wallet) console.log(`Wallet:    ${wallet}`);
  console.log(`8004scan:  ${result.scanUrl}`);
  console.log(
    `\nNext: add AGENT_ID=${result.agentId} to your .env so the hosted ` +
      `registration file binds to this on-chain identity.`
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

main().catch((err) => {
  console.error("\nRegistration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
