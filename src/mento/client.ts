import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "../config/index.js";
import type { Corridor, RouteQuote } from "../types/index.js";

const CELO_MAINNET_TOKENS = {
  USDm: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  EURm: "0x10c826A163F5c566a514aFC6a0a7CA779128f0e0",
  BRLm: "0xE918F7BB3D25d8936De17cCF579613649F1E5974",
  COPm: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // placeholder — update from Mento token list
  XOFm: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // placeholder — update from Mento token list
} as const;

export function loadCorridors(dataDir: string): Corridor[] {
  const path = join(dataDir, "corridors.json");
  return JSON.parse(readFileSync(path, "utf-8")) as Corridor[];
}

export function resolveCorridor(
  corridors: Corridor[],
  sourceCurrency: string,
  destinationCountry: string
): Corridor | undefined {
  return corridors.find(
    (c) =>
      c.sourceCurrency === sourceCurrency.toUpperCase() &&
      c.destinationCountry === destinationCountry.toUpperCase()
  );
}

export async function createMentoClient(config: Config) {
  const { Mento, ChainId } = await import("@mento-protocol/mento-sdk");
  const chainId =
    config.celoChainId === 11142220 ? ChainId.CELO_SEPOLIA : ChainId.CELO;
  return Mento.create(chainId, config.celoRpcUrl);
}

export async function getOptimizedQuote(
  config: Config,
  corridor: Corridor,
  amountUsd: number
): Promise<RouteQuote> {
  const mento = await createMentoClient(config);
  const { parseUnits } = await import("viem");

  const amountIn = parseUnits(amountUsd.toString(), 18);
  const tradable = await mento.trading.isPairTradable(
    corridor.sourceToken,
    corridor.destinationToken
  );

  let amountOut = 0n;
  let routeHops = 0;

  if (tradable) {
    const route = await mento.routes.findRoute(
      corridor.sourceToken,
      corridor.destinationToken
    );
    routeHops = route.path.length;
    amountOut = await mento.quotes.getAmountOut(
      corridor.sourceToken,
      corridor.destinationToken,
      amountIn
    );
  }

  return {
    corridorId: corridor.id,
    amountIn,
    amountOut,
    routeHops,
    estimatedGasUsd: 0.001,
    mentoFeeUsd: amountUsd * 0.001,
    tradable,
  };
}

export { CELO_MAINNET_TOKENS };
