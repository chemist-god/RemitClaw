"use client";

import { useAgentApi } from "../context/AgentApiContext";
import { agentApiBase } from "../lib/api";

export function AgentStatusBanner() {
  const { health, healthError } = useAgentApi();

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
        Quotes work; on-chain sends need <code>AGENT_PRIVATE_KEY</code> on the agent.
      </div>
    );
  }

  return null;
}
