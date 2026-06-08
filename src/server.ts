import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadConfig, type Config } from "./config/index.js";
import {
  executeForMessage,
  getAgentAddress,
  getBalances,
  getHistory,
  quoteForMessage,
} from "./api/service.js";
import { buildAgentCard } from "./agent/agent-card.js";
import { agentRegistryId } from "./agent/registry-addresses.js";
import {
  applySettleHeaders,
  buildPaymentRequirements,
  settleX402Payment,
} from "./x402/handler.js";

const config = loadConfig();

function setCors(res: ServerResponse, origin: string) {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-api-key, X-PAYMENT, PAYMENT-SIGNATURE"
  );
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function transferContext(body: Record<string, unknown>) {
  const ctx: {
    destinationCountry?: string;
    recipientWallet?: string;
    recipientPhone?: string;
  } = {};
  if (body.destinationCountry) {
    ctx.destinationCountry = String(body.destinationCountry).toUpperCase();
  }
  if (body.recipientWallet && /^0x[a-fA-F0-9]{40}$/.test(String(body.recipientWallet))) {
    ctx.recipientWallet = String(body.recipientWallet);
  }
  if (body.recipientPhone) ctx.recipientPhone = String(body.recipientPhone);
  return Object.keys(ctx).length ? ctx : undefined;
}

/** Optional shared-secret check (skipped if AGENT_API_KEY is unset). */
function authorized(req: IncomingMessage, cfg: Config): boolean {
  if (!cfg.agentApiKey) return true;
  return req.headers["x-api-key"] === cfg.agentApiKey;
}

const server = createServer(async (req, res) => {
  setCors(res, config.webOrigin);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        chainId: config.celoChainId,
        executionReady: Boolean(config.agentPrivateKey),
      });
    }

    // ── Public ERC-8004 registration file (Celo docs + EIP-8004) ──
    if (req.method === "GET" && path === "/.well-known/agent.json") {
      return sendJson(
        res,
        200,
        buildAgentCard(config, getAgentAddress(config))
      );
    }

    // ── x402: payment requirements for the premium quote endpoint ──
    if (req.method === "GET" && path === "/api/x402/info") {
      const resourceUrl = `${url.origin}/api/x402/premium-quote`;
      return sendJson(res, 200, buildPaymentRequirements(config, resourceUrl));
    }

    // ── x402-gated premium quote (402 → pay → retry with X-PAYMENT) ──
    if (
      (req.method === "GET" || req.method === "POST") &&
      path === "/api/x402/premium-quote"
    ) {
      const resourceUrl = `${url.origin}/api/x402/premium-quote`;
      const settled = await settleX402Payment(
        config,
        req,
        resourceUrl,
        req.method as "GET" | "POST"
      );

      if (!settled.ok) {
        applySettleHeaders(res, settled.responseHeaders);
        res.setHeader("Accept-Payment", "x402");
        return sendJson(res, settled.status, settled.responseBody);
      }

      if (req.method === "GET") {
        return sendJson(res, 200, {
          paid: true,
          message: "x402 payment accepted — POST a remittance message to quote",
        });
      }

      const body = await readBody(req);
      const message = String(body.message ?? "").trim();
      if (!message) return sendJson(res, 400, { error: "message is required" });
      const quote = await quoteForMessage(config, message);
      return sendJson(res, 200, { paid: true, quote });
    }

    if (!authorized(req, config)) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }

    if (req.method === "POST" && path === "/api/intent") {
      const body = await readBody(req);
      const message = String(body.message ?? "").trim();
      if (!message) return sendJson(res, 400, { error: "message is required" });
      const result = await quoteForMessage(config, message, transferContext(body));
      return sendJson(res, 200, result);
    }

    if (req.method === "POST" && path === "/api/transfer") {
      const body = await readBody(req);
      const message = String(body.message ?? "").trim();
      if (!message) return sendJson(res, 400, { error: "message is required" });
      const result = await executeForMessage(config, message, transferContext(body));
      return sendJson(res, 200, result);
    }

    if (req.method === "GET" && path === "/api/agent") {
      return sendJson(res, 200, {
        address: getAgentAddress(config),
        chainId: config.celoChainId,
        agentId: config.agentId ?? null,
        agentRegistry: agentRegistryId(config),
        registered: config.agentId != null,
      });
    }

    if (req.method === "GET" && path === "/api/history") {
      return sendJson(res, 200, { items: getHistory(config) });
    }

    if (req.method === "GET" && path === "/api/balance") {
      const address = url.searchParams.get("address");
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return sendJson(res, 400, { error: "valid ?address=0x… is required" });
      }
      const items = await getBalances(config, address);
      return sendJson(res, 200, { address, items });
    }

    return sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Internal error";
    return sendJson(res, 500, { error: messageText });
  }
});

server.listen(config.agentApiPort, () => {
  console.log(
    `Remifi agent API listening on http://localhost:${config.agentApiPort} (chainId ${config.celoChainId})`
  );
  if (!config.agentPrivateKey) {
    console.log(
      "⚠️  AGENT_PRIVATE_KEY not set — /api/transfer will fail until you add it."
    );
  }
});
