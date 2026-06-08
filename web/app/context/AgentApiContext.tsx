"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAgentInfo,
  fetchBalances,
  type BalanceItem,
} from "../lib/api";
import { deferNonCritical } from "../lib/defer";
import { useWallet } from "./WalletContext";

type AgentApiContextValue = {
  balances: BalanceItem[];
  balanceAddress: string | null;
  balancesLoading: boolean;
  balancesError: string | null;
  refreshBalances: () => Promise<void>;
};

const AgentApiContext = createContext<AgentApiContextValue | null>(null);

export function AgentApiProvider({ children }: { children: ReactNode }) {
  const { address: connectedAddress } = useWallet();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [balanceAddress, setBalanceAddress] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    setBalancesLoading(true);
    try {
      const address =
        connectedAddress ?? (await fetchAgentInfo()).address ?? null;
      if (!address) {
        setBalances([]);
        setBalanceAddress(null);
        setBalancesError("No wallet connected and agent wallet not configured.");
        return;
      }
      const { items } = await fetchBalances(address);
      setBalances(items);
      setBalanceAddress(address);
      setBalancesError(null);
    } catch (err) {
      setBalances([]);
      setBalanceAddress(null);
      setBalancesError(
        err instanceof Error ? err.message : "Could not load balances"
      );
    } finally {
      setBalancesLoading(false);
    }
  }, [connectedAddress]);

  useEffect(() => {
    return deferNonCritical(() => void refreshBalances());
  }, [refreshBalances]);

  const value = useMemo(
    () => ({
      balances,
      balanceAddress,
      balancesLoading,
      balancesError,
      refreshBalances,
    }),
    [balances, balanceAddress, balancesLoading, balancesError, refreshBalances]
  );

  return (
    <AgentApiContext.Provider value={value}>{children}</AgentApiContext.Provider>
  );
}

export function useAgentApi() {
  const ctx = useContext(AgentApiContext);
  if (!ctx) {
    throw new Error("useAgentApi must be used within AgentApiProvider");
  }
  return ctx;
}
