import type { Config } from "../config/index.js";
import type { RemittanceIntent } from "../types/index.js";

export interface NotificationResult {
  channel: "sms" | "whatsapp";
  to: string;
  sid?: string;
  error?: string;
}

function buildReceiptMessage(intent: RemittanceIntent, txHash?: string): string {
  const lines = [
    `You received ${intent.amount} ${intent.sourceCurrency} via RemitClaw.`,
    intent.recipientName ? `From: ${intent.recipientName}` : undefined,
    txHash ? `Tx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` : undefined,
  ].filter(Boolean);
  return lines.join("\n");
}

export async function notifyRecipient(
  config: Config,
  intent: RemittanceIntent,
  txHash?: string
): Promise<NotificationResult | null> {
  const phone = intent.recipientPhone;
  if (!phone || !config.twilioAccountSid || !config.twilioAuthToken) {
    return null;
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
  const body = buildReceiptMessage(intent, txHash);

  const useWhatsapp = phone.startsWith("whatsapp:") || config.twilioWhatsappFrom;
  const to = phone.startsWith("whatsapp:") ? phone : useWhatsapp ? `whatsapp:${phone}` : phone;
  const from = useWhatsapp
    ? config.twilioWhatsappFrom
    : config.twilioSmsFrom;

  if (!from) return null;

  try {
    const message = await client.messages.create({ body, from, to });
    return {
      channel: useWhatsapp ? "whatsapp" : "sms",
      to,
      sid: message.sid,
    };
  } catch (err) {
    return {
      channel: useWhatsapp ? "whatsapp" : "sms",
      to,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
