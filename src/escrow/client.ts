import {
  encodePacked,
  formatUnits,
  keccak256,
  stringToBytes,
  type Address,
  type Hex,
} from "viem";
import { randomBytes } from "node:crypto";
import type { Config } from "../config/index.js";
import type { Corridor, RouteQuote } from "../types/index.js";
import { REMIFI_VAULT_ABI } from "./abi.js";
import { normalizeE164 } from "./phone.js";
import {
  approveToken,
  getAgentAccount,
  getPublicClient,
  getWalletClient,
} from "../wallet/client.js";
import { swapToRecipient } from "../transfers/onchain.js";

export const VAULT_DOMAIN_SEPARATOR = keccak256(stringToBytes("REMIFI_VAULT_V1"));

export interface ClaimCredentials {
  claimId: Hex;
  secret: Hex;
  phoneHash: Hex;
  claimUrl: string;
}

export interface EscrowDepositResult {
  txHash: Hex;
  claim: ClaimCredentials;
  token: Address;
  amount: bigint;
}

function sameToken(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function hashPhone(phone: string): Hex {
  const normalized = normalizeE164(phone);
  return keccak256(encodePacked(["string"], [normalized]));
}

export function generateClaimSecret(): Hex {
  return keccak256(randomBytes(32));
}

export function computeClaimId(phoneHash: Hex, secret: Hex): Hex {
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "bytes32"],
      [VAULT_DOMAIN_SEPARATOR, phoneHash, secret]
    )
  );
}

export function buildClaimUrl(
  config: Config,
  claimId: Hex,
  secret: Hex
): string {
  const base =
    config.publicBaseUrl?.replace(/\/$/, "") ?? "http://localhost:3000";
  const params = new URLSearchParams({
    c: claimId,
    s: secret,
  });
  return `${base}/claim?${params.toString()}`;
}

export function createClaimCredentials(
  config: Config,
  phone: string
): ClaimCredentials {
  const phoneHash = hashPhone(phone);
  const secret = generateClaimSecret();
  const claimId = computeClaimId(phoneHash, secret);
  return {
    claimId,
    secret,
    phoneHash,
    claimUrl: buildClaimUrl(config, claimId, secret),
  };
}

export function vaultConfigured(config: Config): boolean {
  return Boolean(config.remifiVaultAddress);
}

async function depositToVault(
  config: Config,
  vault: Address,
  token: Address,
  amount: bigint,
  claimId: Hex,
  phoneHash: Hex
): Promise<Hex> {
  const wallet = getWalletClient(config);
  const publicClient = getPublicClient(config);

  await approveToken(config, token, vault, amount);

  const hash = await wallet.writeContract({
    address: vault,
    abi: REMIFI_VAULT_ABI,
    functionName: "deposit",
    args: [claimId, token, amount, phoneHash],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Lock remittance funds in RemifiVault for a phone-only recipient.
 * Cross-currency: Mento swap to agent wallet, then deposit destination token.
 */
export async function executeEscrowRemittance(
  config: Config,
  corridor: Corridor,
  quote: RouteQuote,
  phone: string
): Promise<EscrowDepositResult> {
  if (!config.remifiVaultAddress) {
    throw new Error(
      "REMIFI_VAULT_ADDRESS is not set — deploy RemifiVault and add it to .env for phone-only sends."
    );
  }
  if (!quote.tradable) {
    throw new Error(`Mento pair ${corridor.mentoPair} is not tradable right now.`);
  }

  const vault = config.remifiVaultAddress as Address;
  const account = getAgentAccount(config);
  const sourceToken = corridor.sourceToken as Address;
  const destinationToken = corridor.destinationToken as Address;
  const claim = createClaimCredentials(config, phone);

  let depositToken = destinationToken;
  let depositAmount = quote.amountOut;

  if (sameToken(sourceToken, destinationToken)) {
    depositAmount = quote.amountIn;
  } else {
    const swap = await swapToRecipient(
      config,
      sourceToken,
      destinationToken,
      quote.amountIn,
      account.address
    );
    depositAmount = swap.amountOut;
  }

  const txHash = await depositToVault(
    config,
    vault,
    depositToken,
    depositAmount,
    claim.claimId,
    claim.phoneHash
  );

  return {
    txHash,
    claim,
    token: depositToken,
    amount: depositAmount,
  };
}

export async function readEscrow(
  config: Config,
  claimId: Hex
): Promise<{
  depositor: Address;
  token: Address;
  amount: bigint;
  expiry: bigint;
  status: number;
  amountFormatted: string;
} | null> {
  if (!config.remifiVaultAddress) return null;

  try {
    const client = getPublicClient(config);
    const result = await client.readContract({
      address: config.remifiVaultAddress as Address,
      abi: REMIFI_VAULT_ABI,
      functionName: "getEscrow",
      args: [claimId],
    });

    const [depositor, token, amount, , expiry, status] = result;
    return {
      depositor,
      token,
      amount,
      expiry,
      status: Number(status),
      amountFormatted: formatUnits(amount, 18),
    };
  } catch {
    return null;
  }
}
