"use client";

import { useActiveWallet, useDisconnect } from "thirdweb/react";

/** Disconnect the active thirdweb wallet without opening the details modal. */
export function DisconnectWallet() {
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  if (!wallet) return null;

  return (
    <button
      type="button"
      className="btn btn-outline btn-block"
      onClick={() => disconnect(wallet)}
    >
      Disconnect wallet
    </button>
  );
}
