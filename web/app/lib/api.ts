const API_BASE =
  process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:8787";

const API_KEY = process.env.NEXT_PUBLIC_AGENT_API_KEY;

export type QuoteResponse = {
  kind: "quote" | "schedule";
  intent: {
    amount: number;
    sourceCurrency: string;
    destinationCountry: string;
    recipientName?: string;
    frequency: string;
  };
  summary: string;
  savings?: string;
  needsConfirmation?: boolean;
  recipientReceives?: number;
  destinationCurrency?: string;
  mentoFeeUsd?: number;
  estimatedGasUsd?: number;
  routeHops?: number;
  mentoPair?: string;
  scheduleNextRunAt?: string;
};

export type TransferResponse = {
  status: "confirmed" | "failed";
  receiptId: string;
  txHash?: string;
  recipientReceives: number;
  destinationCurrency: string;
  summary: string;
  savings: string;
};

export type BalanceResponse = {
  address: string;
  items: { symbol: string; address: string; balance: number }[];
};

export type AgentResponse = {
  address: string | null;
  chainId: number;
};

function headers(): Record<string, string> {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) base["x-api-key"] = API_KEY;
  return base;
}

async function handle<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data;
}

/** Parse a message and fetch a live Mento quote + fee comparison (no execution). */
export async function fetchQuote(message: string): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE}/api/intent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message }),
  });
  return handle<QuoteResponse>(res);
}

/** Execute a transfer derived from a message. Returns a real txHash on success. */
export async function executeTransfer(
  message: string,
  recipientWallet?: string
): Promise<TransferResponse> {
  const res = await fetch(`${API_BASE}/api/transfer`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message, recipientWallet }),
  });
  return handle<TransferResponse>(res);
}

/** The agent's own on-chain address (Model A wallet) used for demo balances. */
export async function fetchAgentAddress(): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE}/api/agent`, { headers: headers() });
  return handle<AgentResponse>(res);
}

export async function fetchBalances(address: string): Promise<BalanceResponse> {
  const res = await fetch(
    `${API_BASE}/api/balance?address=${encodeURIComponent(address)}`,
    { headers: headers() }
  );
  return handle<BalanceResponse>(res);
}

/** Celo explorer tx link (mainnet by default; Sepolia uses celo-sepolia subdomain). */
export function explorerTxUrl(txHash: string): string {
  const base =
    process.env.NEXT_PUBLIC_CELO_EXPLORER ?? "https://celoscan.io";
  return `${base}/tx/${txHash}`;
}
