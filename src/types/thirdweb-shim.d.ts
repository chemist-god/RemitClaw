/** Minimal stubs until `thirdweb` is installed in the repo root (`npm install`). */
declare module "thirdweb" {
  export function createThirdwebClient(opts: {
    clientId?: string;
    secretKey?: string;
  }): unknown;
}

declare module "thirdweb/x402" {
  export function facilitator(opts: {
    client: unknown;
    serverWalletAddress: string;
  }): unknown;

  export function settlePayment(opts: {
    resourceUrl: string;
    method: string;
    paymentData?: string;
    payTo: string;
    network: unknown;
    price: string;
    facilitator: unknown;
    routeConfig?: { description?: string; mimeType?: string };
  }): Promise<{
    status: number;
    responseBody?: unknown;
    responseHeaders?: Record<string, string>;
  }>;
}

declare module "thirdweb/chains" {
  export const celo: unknown;
  export const celoSepolia: unknown;
}
