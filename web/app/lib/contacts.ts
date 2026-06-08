import { getCountryLabel } from "../data/countries";
import type { Person } from "../data/people";
import type { TransferContext } from "./api";

/** Match a parsed recipient name to a saved contact (case-insensitive). */
export function matchContact(
  name: string | undefined,
  people: Person[]
): Person | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  const exact = people.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact;
  return people.find((p) => p.name.toLowerCase().startsWith(lower));
}

/** Extract a recipient name from common pay phrases ("send $50 to Mom"). */
export function extractRecipientName(message: string): string | undefined {
  const tail = message.match(/\bto\s+(.+)$/i)?.[1];
  if (!tail) return undefined;
  return tail.replace(/\s+in\s+.+$/i, "").trim() || undefined;
}

/** Build agent API context from a matched contact. */
export function contactTransferContext(contact?: Person): TransferContext | undefined {
  if (!contact) return undefined;
  const ctx: TransferContext = {};
  if (contact.country) ctx.destinationCountry = contact.country;
  if (contact.walletAddress) ctx.recipientWallet = contact.walletAddress;
  if (contact.phone) ctx.recipientPhone = contact.phone;
  return Object.keys(ctx).length ? ctx : undefined;
}

/** Append country to the message when the contact has one (helps intent parser). */
export function enrichMessageWithContact(
  message: string,
  contact?: Person
): string {
  if (!contact?.country) return message;
  const label = getCountryLabel(contact.country);
  if (message.toLowerCase().includes(label.toLowerCase())) return message;
  if (message.toLowerCase().includes(contact.country.toLowerCase())) return message;
  return `${message} in ${label}`;
}
