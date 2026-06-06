#!/usr/bin/env node
import { parseRemittanceIntent } from "../intent/parser.js";

const message = process.argv.slice(2).join(" ");
if (!message) {
  console.error('Usage: npx tsx src/cli/parse-intent.ts "Send $50 to my mom in the Philippines"');
  process.exit(1);
}

try {
  const intent = parseRemittanceIntent(message);
  console.log(JSON.stringify(intent, null, 2));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
