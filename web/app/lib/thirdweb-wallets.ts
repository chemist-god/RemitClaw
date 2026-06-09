import { createWallet, inAppWallet, type Wallet } from "thirdweb/wallets";
import { celoChain } from "./thirdweb";

/** Shared wallet list for connect modal + auto-reconnect. */
export function getRemifiWallets(): Wallet[] {
  return [
    inAppWallet({
      auth: { options: ["email", "google", "apple", "passkey"] },
      metadata: { name: "RemitClaw" },
      smartAccount: {
        chain: celoChain,
        sponsorGas: true,
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.valoraapp"),
    createWallet("walletConnect"),
  ];
}
