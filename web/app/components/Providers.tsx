"use client";

import { AddContactProvider } from "../context/AddContactContext";
import { ContactsProvider } from "../context/ContactsContext";
import { LanguageProvider } from "../context/LanguageContext";
import { WalletPreferencesProvider } from "../context/WalletPreferencesContext";
import { Web3Providers } from "./Web3Providers";

/** App-wide providers (including thirdweb for wallet persistence). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ContactsProvider>
        <WalletPreferencesProvider>
          <AddContactProvider>
            <Web3Providers>{children}</Web3Providers>
          </AddContactProvider>
        </WalletPreferencesProvider>
      </ContactsProvider>
    </LanguageProvider>
  );
}
