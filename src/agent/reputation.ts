import { type Address, type Hex } from "viem";
import type { Config } from "../config/index.js";
import {
  getAgentAccount,
  getPublicClient,
  getWalletClient,
} from "../wallet/client.js";

/** Minimal Reputation Registry ABI (giveFeedback + read helpers). */
export const REPUTATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getSummary",
    stateMutability: "view",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
    ],
    outputs: [
      { name: "count", type: "uint64" },
      { name: "averageValue", type: "int128" },
    ],
  },
] as const;

export interface GiveFeedbackInput {
  agentId: number;
  /** Score 0–100 (use tag `starred` per Celo docs). */
  score: number;
  tag1?: string;
  tag2?: string;
  endpoint?: string;
  feedbackUri?: string;
}

/**
 * Submit on-chain feedback to the ERC-8004 Reputation Registry.
 *
 * Per Celo docs, common tags include `starred` (quality 0–100), `uptime`,
 * `successRate`, `responseTime`, `reachable`. Agents cannot rate themselves.
 */
export async function giveFeedback(
  config: Config,
  input: GiveFeedbackInput
): Promise<Hex> {
  const account = getAgentAccount(config);
  const publicClient = getPublicClient(config);
  const walletClient = getWalletClient(config);

  const { request } = await publicClient.simulateContract({
    account,
    address: config.reputationRegistryAddress as Address,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "giveFeedback",
    args: [
      BigInt(input.agentId),
      BigInt(input.score),
      0,
      input.tag1 ?? "starred",
      input.tag2 ?? "",
      input.endpoint ?? "",
      input.feedbackUri ?? "",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ],
  });

  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/** Read aggregated reputation for an agent (tag-filtered summary). */
export async function getReputationSummary(
  config: Config,
  agentId: number,
  tag1 = "starred",
  tag2 = ""
): Promise<{ count: bigint; averageValue: bigint }> {
  const publicClient = getPublicClient(config);
  const [count, averageValue] = await publicClient.readContract({
    address: config.reputationRegistryAddress as Address,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getSummary",
    args: [BigInt(agentId), tag1, tag2],
  });
  return { count, averageValue };
}
