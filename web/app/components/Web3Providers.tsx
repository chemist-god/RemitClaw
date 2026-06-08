"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { AgentApiProvider } from "../context/AgentApiContext";

/** Wallet + agent API — only mounted for authenticated app routes, not onboarding. */
export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <AgentApiProvider>{children}</AgentApiProvider>
    </ThirdwebProvider>
  );
}
