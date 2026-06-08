"use client";

import { useMemo, useState } from "react";
import { getCountryLabel, phonePlaceholder } from "../data/countries";
import { useContacts } from "../context/ContactsContext";
import { ConfirmationModal } from "./ConfirmationModal";
import { CountryPickerField } from "./CountryPickerSheet";
import { Avatar } from "./Avatar";

type AddContactFormProps = {
  onSaved: () => void;
};

export function AddContactForm({ onSaved }: AddContactFormProps) {
  const { addPerson } = useContacts();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("PH");
  const [phone, setPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [favourite, setFavourite] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPhase, setConfirmPhase] = useState<"confirm" | "success">("confirm");

  const previewName = name.trim() || "Contact";
  const countryLabel = getCountryLabel(country);

  const modalDetails = useMemo(
    () => [
      { label: "Name", value: name.trim() },
      { label: "Country", value: countryLabel },
      ...(phone.trim() ? [{ label: "Phone", value: phone.trim() }] : []),
      ...(walletAddress.trim()
        ? [{ label: "Wallet", value: `${walletAddress.trim().slice(0, 8)}…` }]
        : []),
      { label: "Favourite", value: favourite ? "Yes" : "No" },
    ],
    [countryLabel, favourite, name, phone]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setConfirmPhase("confirm");
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    addPerson({
      name: name.trim(),
      country,
      phone: phone.trim() || undefined,
      favourite,
    });
    setConfirmPhase("success");
  };

  const handleCloseConfirm = () => {
    const wasSuccess = confirmPhase === "success";
    setConfirmOpen(false);
    setConfirmPhase("confirm");
    if (wasSuccess) {
      onSaved();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex flex-col items-center pt-1">
          <Avatar name={previewName} ring size={72} />
          <p className="mt-3 text-sm text-muted">They&apos;ll appear on your home screen</p>
        </div>

        <section className="mt-6">
          <label htmlFor="add-contact-name" className="form-label">
            Full name
          </label>
          <input
            id="add-contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom, Carlos, Aisha"
            className="form-field mt-2 w-full"
            autoComplete="name"
            required
          />
        </section>

        <section className="mt-5">
          <CountryPickerField value={country} onChange={setCountry} />
        </section>

        <section className="mt-5">
          <label htmlFor="add-contact-wallet" className="form-label">
            Celo wallet <span className="font-normal text-soft">(optional)</span>
          </label>
          <input
            id="add-contact-wallet"
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x… for direct on-chain delivery"
            className="form-field mt-2 w-full font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </section>

        <section className="mt-5">
          <label htmlFor="add-contact-phone" className="form-label">
            Phone <span className="font-normal text-soft">(optional)</span>
          </label>
          <input
            id="add-contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={phonePlaceholder(country)}
            className="form-field mt-2 w-full"
            autoComplete="tel"
          />
        </section>

        <label className="method-row mt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={favourite}
            onChange={(e) => setFavourite(e.target.checked)}
            className="accent-brand-500"
          />
          <span className="font-semibold text-ink">Add to favourites</span>
        </label>

        <button
          type="submit"
          className="btn btn-gradient btn-block mt-6"
          disabled={!name.trim()}
        >
          Save contact
        </button>
      </form>

      <ConfirmationModal
        open={confirmOpen}
        variant="save"
        phase={confirmPhase}
        recipientName={name.trim()}
        details={modalDetails}
        onConfirm={handleConfirm}
        onClose={handleCloseConfirm}
      />
    </>
  );
}