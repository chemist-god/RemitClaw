/** Contact Picker API — supported on Chrome Android and some mobile browsers. */
export type PickedPhoneContact = {
  name: string;
  phone?: string;
};

type ContactPickerContact = {
  name?: string[];
  tel?: string[];
};

function contactPickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "contacts" in navigator &&
    typeof (navigator as Navigator & { contacts?: { select: unknown } }).contacts
      ?.select === "function"
  );
}

function contactsApi() {
  return (
    navigator as Navigator & {
      contacts: {
        select: (
          props: string[],
          opts?: { multiple?: boolean }
        ) => Promise<ContactPickerContact[]>;
      };
    }
  ).contacts;
}

function parsePicked(row: ContactPickerContact): PickedPhoneContact | null {
  const name = row.name?.[0]?.trim();
  const phone = row.tel?.[0]?.trim();
  if (!name || !phone) return null;
  return { name, phone };
}

/** Pick one contact from the device address book. */
export async function pickPhoneContact(): Promise<PickedPhoneContact | null> {
  if (!contactPickerSupported()) return null;

  const picked = await contactsApi().select(["name", "tel"], { multiple: false });
  return parsePicked(picked[0] ?? {}) ?? null;
}

/**
 * Bulk-import from the device address book.
 * User must approve the picker — browsers do not allow silent background reads.
 */
export async function pickPhoneContacts(): Promise<PickedPhoneContact[]> {
  if (!contactPickerSupported()) return [];

  const picked = await contactsApi().select(["name", "tel"], { multiple: true });
  const results: PickedPhoneContact[] = [];

  for (const row of picked) {
    const contact = parsePicked(row);
    if (contact) results.push(contact);
  }

  return results;
}

export function canPickPhoneContacts(): boolean {
  return contactPickerSupported();
}
