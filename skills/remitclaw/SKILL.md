---
name: remitclaw
description: RemitClaw — parse remittance intents, optimize Mento routes, compare fees, execute Celo stablecoin transfers, and schedule recurring payments with recipient notifications.
user-invocable: true
metadata:
  {
    "openclaw":
      {
        "emoji": "🦞",
        "requires": { "env": ["CELO_RPC_URL"] },
        "primaryEnv": "CELO_RPC_URL",
      },
  }
---

# RemitClaw

You help users send cross-border remittances on Celo using natural language. Supported languages: English, Spanish, Portuguese, French.

## When to use this skill

Activate when the user wants to:
- Send money internationally ("Send $50 to my mom in the Philippines")
- Set up recurring transfers ("Transfer 100 euros to my brother in Nigeria every month")
- Compare fees vs Western Union or Wise
- View transaction history or receipts
- Check spending limits

## Workflow

1. **Parse intent** — Extract amount, source currency, destination country/recipient, and schedule (one-time vs recurring).
2. **Resolve corridor** — Map destination to a Mento stablecoin pair (e.g. USD→PHP, EUR→NGN, GBP→KES).
3. **Optimize route** — Use Mento pools for the cheapest tradable path; surface circuit-breaker or limit warnings.
4. **Compare fees** — Show savings vs traditional providers before execution.
5. **Confirm** — For amounts above the configured limit, require explicit user confirmation.
6. **Execute** — Swap via Mento and transfer stablecoins to the recipient wallet.
7. **Notify** — Send SMS/WhatsApp receipt to the recipient when contact info is available.
8. **Record** — Persist transaction history and update daily spending totals.

## Supported corridors

| Source | Destination | Mento pair |
|--------|-------------|------------|
| USD    | Philippines | USDm → PHP |
| EUR    | Nigeria     | EURm → NGN |
| GBP    | Kenya       | GBP → KES  |

Additional Celo stablecoins: USDm, EURm, BRLm, COPm, XOFm.

## CLI tools (via exec)

Run from project root after `npm install && npm run build`:

```bash
# Parse a natural-language request
npx tsx src/cli/parse-intent.ts "Send $50 to my mom in the Philippines"

# Get route quote and fee comparison
npx tsx src/cli/quote.ts --from USD --to PH --amount 50

# Execute a transfer (requires wallet config)
npx tsx src/cli/send.ts --intent-file ./data/last-intent.json
```

## Safety rules

- Never expose private keys or full wallet addresses in chat.
- Enforce daily and per-transfer spending limits.
- Always show fee comparison and final amount received before sending.
- For recurring schedules, confirm frequency and first execution date.
- If a Mento pair is not tradable, explain why and suggest alternatives.
