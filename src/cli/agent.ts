#!/usr/bin/env node
import { loadConfig } from "../config/index.js";
import { RemitClawAgent } from "../agent/remitclaw-agent.js";

const message = process.argv.slice(2).join(" ");
if (!message) {
  console.error('Usage: npm run dev -- "Send $50 to my mom in the Philippines"');
  process.exit(1);
}

const config = loadConfig();
const agent = new RemitClawAgent(config);

agent
  .handleMessage(message)
  .then((res) => {
    console.log("\n--- Agent Response ---\n");
    console.log(res.message);
    if (res.needsConfirmation) console.log("\n[Awaiting confirmation]");
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
