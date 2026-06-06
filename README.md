# RemitClaw

An AI agent that understands natural-language remittance requests and executes cross-border transfers using Celo stablecoins via [Mento Protocol](https://mento.org). Built on [OpenClaw](https://openclaw.ai) for conversation memory, multi-channel messaging, and transaction orchestration.

> "Send $50 to my mom in the Philippines" → route optimization, fee comparison, and on-chain execution.

## Features

| Feature | Module |
|---------|--------|
| Multi-language intent parsing (EN, ES, PT, FR) | `src/intent/` |
| Mento route optimization (USD→PHP, EUR→NGN, GBP→KES) | `src/mento/` |
| Fee comparison vs Western Union & Wise | `src/fees/` |
| Recurring transfer scheduling | `src/transfers/scheduler.ts` |
| SMS / WhatsApp recipient notifications | `src/notifications/` |
| Transaction history, receipts & spending limits | `src/history/` |

## Project structure

```
remitclaw/
├── openclaw.json          # OpenClaw agent + skill config
├── skills/remitclaw/      # OpenClaw SKILL.md for the agent
├── src/
│   ├── agent/             # RemitClawAgent orchestrator
│   ├── intent/            # NLU parser + locale patterns
│   ├── mento/             # Mento SDK client & quotes
│   ├── fees/              # Traditional provider comparison
│   ├── transfers/         # Execution, limits, scheduling
│   ├── notifications/     # Twilio SMS / WhatsApp
│   ├── history/           # Transaction store
│   ├── config/            # Environment config (zod)
│   └── cli/               # Dev CLI utilities
├── data/
│   ├── corridors.json     # Supported remittance corridors
│   ├── transactions.json  # Local tx history
│   └── schedules.json     # Recurring transfer schedules
└── tests/
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Celo RPC, wallet key, Twilio creds, and limits
```

### 3. Run tests

```bash
npm test
```

### 4. Try the CLI

```bash
# Parse natural language (offline — no chain calls)
npx tsx src/cli/parse-intent.ts "Send $50 to my mom in the Philippines"

# Get Mento quote + fee comparison (requires network)
npx tsx src/cli/quote.ts --from USD --to PH --amount 50
```

### 5. Connect OpenClaw

Install and start the OpenClaw gateway, then point it at this workspace:

```bash
# Install OpenClaw globally (see https://docs.openclaw.ai)
npm install -g openclaw

# Onboard and start gateway
openclaw onboard
openclaw gateway start
```

The `openclaw.json` in this repo registers the `remitclaw` skill. OpenClaw loads `skills/remitclaw/SKILL.md` and exposes the agent on your configured channels (WhatsApp, Telegram, etc.).

## Integrations

| Service | Purpose | Config keys |
|---------|---------|-------------|
| **OpenClaw** | Agent framework, NLU, memory, channels | `OPENCLAW_GATEWAY_URL` |
| **Mento SDK** | Multi-currency swaps on Celo | `CELO_RPC_URL`, `CELO_CHAIN_ID` |
| **Celo stablecoins** | USDm, EURm, BRLm, COPm, XOFm | Token addresses in `data/corridors.json` |
| **Twilio** | SMS / WhatsApp notifications | `TWILIO_*` env vars |
| **viem** | Wallet & transaction signing | `AGENT_PRIVATE_KEY` |

## Security

- Spending limits enforced via `DAILY_TRANSFER_LIMIT_USD`, `SINGLE_TRANSFER_LIMIT_USD`
- Transfers above `REQUIRE_CONFIRMATION_ABOVE_USD` require explicit user confirmation
- Never commit `.env` or private keys
- Update Mento token addresses in `data/corridors.json` from the [Mento token list](https://docs.mento.org)

## Development

```bash
npm run dev        # Run agent CLI with a message
npm run build      # Compile TypeScript
npm run typecheck  # Type-check without emit
```

## License

MIT
