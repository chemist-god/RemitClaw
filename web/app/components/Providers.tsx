"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { AddContactProvider } from "../context/AddContactContext";
import { ContactsProvider } from "../context/ContactsContext";
import { WalletPreferencesProvider } from "../context/WalletPreferencesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ContactsProvider>
        <WalletPreferencesProvider>
          <AddContactProvider>{children}</AddContactProvider>
        </WalletPreferencesProvider>
      </ContactsProvider>
    </ThirdwebProvider>
  );
}
