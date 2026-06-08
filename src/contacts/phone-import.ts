import { normalizeE164 } from "../escrow/phone.js";
import type { PhoneImportEntry, StoredContact } from "./types.js";

export function phoneContactId(phone: string): string {
  const digits = normalizeE164(phone).replace(/\D/g, "");
  return `phone-${digits}`;
}

/** Merge phone address-book entries into an existing contact list. */
export function mergePhoneImports(
  existing: StoredContact[],
  entries: PhoneImportEntry[]
): StoredContact[] {
  const byId = new Map(existing.map((c) => [c.id, c]));
  const byPhone = new Map<string, StoredContact>();
  for (const c of existing) {
    if (c.phone) {
      try {
        byPhone.set(normalizeE164(c.phone), c);
      } catch {
        // skip invalid stored phone
      }
    }
  }

  const now = new Date().toISOString();

  for (const entry of entries) {
    if (!entry.name?.trim() || !entry.phone?.trim()) continue;

    let phone: string;
    try {
      phone = normalizeE164(entry.phone);
    } catch {
      continue;
    }

    const id = phoneContactId(phone);
    const prev = byPhone.get(phone) ?? byId.get(id);
    const name = entry.name.trim();

    const merged: StoredContact = {
      id: prev?.id ?? id,
      name,
      phone,
      country: prev?.country,
      walletAddress: prev?.walletAddress,
      favourite: prev?.favourite,
      source: prev?.source === "manual" ? "manual" : "phone",
      updatedAt: now,
    };

    byId.set(merged.id, merged);
    byPhone.set(phone, merged);
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
