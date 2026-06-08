export const REMIFI_VAULT_ABI = [
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
] as const;

export const ESCROW_STATUS_ACTIVE = 1;
