export const REMIFI_VAULT_ABI = [
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "computeClaimId",
    stateMutability: "pure",
    inputs: [
      { name: "phoneHash", type: "bytes32" },
      { name: "secret", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "phoneHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "secret", type: "bytes32" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getEscrow",
    stateMutability: "view",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [
      { name: "depositor", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "phoneHash", type: "bytes32" },
      { name: "expiry", type: "uint64" },
      { name: "status", type: "uint8" },
    ],
  },
] as const;

/** Matches RemifiVault.EscrowStatus — Active = 1 */
export const ESCROW_STATUS_ACTIVE = 1;
