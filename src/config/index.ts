import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  celoRpcUrl: z.string().url(),
  celoChainId: z.coerce.number().default(42220),
  agentPrivateKey: z.string().optional(),
  openclawGatewayUrl: z.string().url().default("http://127.0.0.1:18789"),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioWhatsappFrom: z.string().optional(),
  twilioSmsFrom: z.string().optional(),
  dailyTransferLimitUsd: z.coerce.number().default(500),
  singleTransferLimitUsd: z.coerce.number().default(200),
  requireConfirmationAboveUsd: z.coerce.number().default(100),
  dataDir: z.string().default("./data"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    celoRpcUrl: process.env.CELO_RPC_URL,
    celoChainId: process.env.CELO_CHAIN_ID,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY,
    openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
    twilioSmsFrom: process.env.TWILIO_SMS_FROM,
    dailyTransferLimitUsd: process.env.DAILY_TRANSFER_LIMIT_USD,
    singleTransferLimitUsd: process.env.SINGLE_TRANSFER_LIMIT_USD,
    requireConfirmationAboveUsd: process.env.REQUIRE_CONFIRMATION_ABOVE_USD,
    dataDir: process.env.DATA_DIR,
    logLevel: process.env.LOG_LEVEL,
  });
}
