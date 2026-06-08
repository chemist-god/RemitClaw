import { z } from "zod";

export const ContactSourceSchema = z.enum(["phone", "manual", "seed"]);

export const StoredContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().length(2).optional(),
  phone: z.string().optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  favourite: z.boolean().optional(),
  /** Where this contact came from — phone address book vs manual web entry. */
  source: ContactSourceSchema.optional(),
  updatedAt: z.string().datetime().optional(),
});

export type StoredContact = z.infer<typeof StoredContactSchema>;

export const DEFAULT_CONTACTS: StoredContact[] = [
  {
    id: "mom",
    name: "Mom",
    country: "PH",
    favourite: true,
    source: "seed",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "sister",
    name: "Sister",
    country: "PH",
    favourite: true,
    source: "seed",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "tolly",
    name: "Tolly",
    country: "PH",
    favourite: true,
    source: "seed",
    updatedAt: new Date(0).toISOString(),
  },
];

export type PhoneImportEntry = {
  name: string;
  phone: string;
};
