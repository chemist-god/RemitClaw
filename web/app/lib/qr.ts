const ETH_ADDRESS = /0x[a-fA-F0-9]{40}/;

/** Pull a Celo/EVM address from a raw QR payload (plain 0x, ethereum:, celo:). */
export function parseWalletFromQr(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const pathMatch = url.pathname.match(ETH_ADDRESS);
    if (pathMatch) return pathMatch[0];
    const addrParam = url.searchParams.get("address");
    if (addrParam && ETH_ADDRESS.test(addrParam)) return addrParam;
  } catch {
    /* not a URL */
  }

  const match = trimmed.match(ETH_ADDRESS);
  return match?.[0] ?? null;
}

export function isValidWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}
