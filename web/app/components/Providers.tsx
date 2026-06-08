"use client";

import { AddContactProvider } from "../context/AddContactContext";
import { ContactsProvider } from "../context/ContactsContext";
import { LanguageProvider } from "../context/LanguageContext";
import { WalletPreferencesProvider } from "../context/WalletPreferencesContext";

/** Lightweight providers shared by every route (including onboarding). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ContactsProvider>
        <WalletPreferencesProvider>
          <AddContactProvider>{children}</AddContactProvider>
        </WalletPreferencesProvider>
      </ContactsProvider>
    </LanguageProvider>
  );
}
