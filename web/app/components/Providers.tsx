"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { AddContactProvider } from "../context/AddContactContext";
import { AgentApiProvider } from "../context/AgentApiContext";
import { ContactsProvider } from "../context/ContactsContext";
import { WalletPreferencesProvider } from "../context/WalletPreferencesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ContactsProvider>
        <AgentApiProvider>
          <WalletPreferencesProvider>
            <AddContactProvider>{children}</AddContactProvider>
          </WalletPreferencesProvider>
        </AgentApiProvider>
      </ContactsProvider>
    </ThirdwebProvider>
  );
}
