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
  fetchHealth,
  type BalanceItem,
  type HealthResponse,
} from "../lib/api";
import { useWallet } from "./WalletContext";

type AgentApiContextValue = {
  health: HealthResponse | null;
  healthError: string | null;
  balances: BalanceItem[];
  balanceAddress: string | null;
  balancesLoading: boolean;
  balancesError: string | null;
  refreshBalances: () => Promise<void>;
  refreshHealth: () => Promise<void>;
};

const AgentApiContext = createContext<AgentApiContextValue | null>(null);

export function AgentApiProvider({ children }: { children: ReactNode }) {
  const { address: connectedAddress } = useWallet();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [balanceAddress, setBalanceAddress] = useState<string | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const h = await fetchHealth();
      setHealth(h);
      setHealthError(null);
    } catch (err) {
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : "Agent API offline");
    }
  }, []);

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
      setBalancesError(err instanceof Error ? err.message : "Could not load balances");
    } finally {
      setBalancesLoading(false);
    }
  }, [connectedAddress]);

  useEffect(() => {
    void refreshHealth();
    const id = setInterval(() => void refreshHealth(), 30_000);
    return () => clearInterval(id);
  }, [refreshHealth]);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const value = useMemo(
    () => ({
      health,
      healthError,
      balances,
      balanceAddress,
      balancesLoading,
      balancesError,
      refreshBalances,
      refreshHealth,
    }),
    [
      health,
      healthError,
      balances,
      balanceAddress,
      balancesLoading,
      balancesError,
      refreshBalances,
      refreshHealth,
    ]
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
