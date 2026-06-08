/** Celo mainnet chain id. */
export const CELO_MAINNET_CHAIN_ID = 42220;

/** Celo Sepolia testnet chain id (forno). */
export const CELO_SEPOLIA_CHAIN_ID = 11142220;

/** ERC-8004 Identity Registry deployments (source: docs.celo.org/build-on-celo/build-with-ai/8004). */
export const IDENTITY_REGISTRY = {
  mainnet: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  sepolia: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
} as const;

/** ERC-8004 Reputation Registry deployments. */
export const REPUTATION_REGISTRY = {
  mainnet: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  sepolia: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
} as const;

export function isCeloSepolia(chainId: number): boolean {
  return chainId === CELO_SEPOLIA_CHAIN_ID;
}

export function defaultIdentityRegistry(chainId: number): string {
  return isCeloSepolia(chainId)
    ? IDENTITY_REGISTRY.sepolia
    : IDENTITY_REGISTRY.mainnet;
}

export function defaultReputationRegistry(chainId: number): string {
  return isCeloSepolia(chainId)
    ? REPUTATION_REGISTRY.sepolia
    : REPUTATION_REGISTRY.mainnet;
}

/** `{namespace}:{chainId}:{identityRegistry}` global agent registry id. */
export function agentRegistryId(config: {
  celoChainId: number;
  identityRegistryAddress: string;
}): string {
  return `eip155:${config.celoChainId}:${config.identityRegistryAddress}`;
}
