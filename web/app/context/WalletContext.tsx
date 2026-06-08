"use client";

import { useActiveAccount, useActiveWallet } from "thirdweb/react";

export type WalletState = {
  address: string | null;
  isConnected: boolean;
  walletId: string | null;
};

/**
 * Thin convenience hook over thirdweb's connection hooks so components can read
 * the active wallet address without importing thirdweb everywhere.
 */
export function useWallet(): WalletState {
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  return {
    address: account?.address ?? null,
    isConnected: Boolean(account?.address),
    walletId: wallet?.id ?? null,
  };
}

/** Shorten an address to 0x1234…abcd for display. */
export function shortAddress(address: string | null | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
