"use client";

import { useEffect, useState } from "react";
import {
  agentApiBase,
  fetchHealth,
  type HealthResponse,
} from "../lib/api";
import { deferNonCritical } from "../lib/defer";

export function AgentStatusBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await fetchHealth();
        setHealth(h);
        setHealthError(null);
      } catch (err) {
        setHealth(null);
        setHealthError(
          err instanceof Error ? err.message : "Agent API offline"
        );
      }
    };

    const cancel = deferNonCritical(() => void load());
    const id = setInterval(() => void load(), 60_000);
    return () => {
      cancel();
      clearInterval(id);
    };
  }, []);

  if (healthError) {
    return (
      <div className="mx-5 mb-2 rounded-[var(--radius-lg)] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Agent API offline ({agentApiBase()}). Run{" "}
        <code className="font-semibold">npm run serve</code> in the project root.
      </div>
    );
  }

  if (health && !health.executionReady) {
    return (
      <div className="mx-5 mb-2 rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3 text-sm text-muted">
        Quotes work; on-chain sends need <code>AGENT_PRIVATE_KEY</code> on the
        agent.
      </div>
    );
  }

  return null;
}
