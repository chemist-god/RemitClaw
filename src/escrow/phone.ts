/** Normalize a phone number to E.164-ish form for hashing and SMS. */
export function normalizeE164(phone: string): string {
  let raw = phone.trim();
  if (raw.startsWith("whatsapp:")) raw = raw.slice("whatsapp:".length);

  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) throw new Error("Invalid phone number");

  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}
