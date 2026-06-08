import { createThirdwebClient, defineChain, type ThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

/** True when a thirdweb client ID is configured. */
export const thirdwebConfigured = Boolean(clientId);

let cachedClient: ThirdwebClient | null = null;

/**
 * Lazily create the thirdweb client only when configured.
 * Avoids throwing during SSR/build when NEXT_PUBLIC_THIRDWEB_CLIENT_ID is unset.
 */
export function getThirdwebClient(): ThirdwebClient | null {
  if (!clientId) return null;
  if (!cachedClient) {
    cachedClient = createThirdwebClient({ clientId });
  }
  return cachedClient;
}

const CELO_MAINNET_ID = 42220;
const CELO_SEPOLIA_ID = 11142220;

const chainId = Number(
  process.env.NEXT_PUBLIC_CELO_CHAIN_ID ?? CELO_MAINNET_ID
);

/** Celo chain used across the app (mainnet by default, Sepolia when configured). */
export const celoChain = defineChain({
  id: chainId,
  name: chainId === CELO_MAINNET_ID ? "Celo" : "Celo Sepolia",
  nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
  rpc:
    process.env.NEXT_PUBLIC_CELO_RPC_URL ??
    (chainId === CELO_SEPOLIA_ID
      ? "https://forno.celo-sepolia.celo-testnet.org"
      : "https://forno.celo.org"),
});
