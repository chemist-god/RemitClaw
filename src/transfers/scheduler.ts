import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { RemittanceIntent, TransferRecord } from "../types/index.js";

interface ScheduleEntry {
  id: string;
  intent: RemittanceIntent;
  nextRunAt: string;
  active: boolean;
}

function ensureDataDir(dataDir: string): void {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

function schedulesPath(dataDir: string): string {
  return join(dataDir, "schedules.json");
}

export function loadSchedules(dataDir: string): ScheduleEntry[] {
  ensureDataDir(dataDir);
  const path = schedulesPath(dataDir);
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf-8")) as ScheduleEntry[];
}

export function saveSchedule(dataDir: string, entry: ScheduleEntry): void {
  const schedules = loadSchedules(dataDir).filter((s) => s.id !== entry.id);
  schedules.push(entry);
  writeFileSync(schedulesPath(dataDir), JSON.stringify(schedules, null, 2));
}

export function computeNextRun(frequency: RemittanceIntent["frequency"]): Date {
  const next = new Date();
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      break;
  }
  return next;
}

export function scheduleRecurringTransfer(
  dataDir: string,
  intent: RemittanceIntent
): ScheduleEntry {
  if (intent.frequency === "once") {
    throw new Error("Cannot schedule a one-time transfer");
  }

  const entry: ScheduleEntry = {
    id: crypto.randomUUID(),
    intent,
    nextRunAt: computeNextRun(intent.frequency).toISOString(),
    active: true,
  };

  saveSchedule(dataDir, entry);
  return entry;
}

export function getDueSchedules(dataDir: string): ScheduleEntry[] {
  const now = Date.now();
  return loadSchedules(dataDir).filter(
    (s) => s.active && new Date(s.nextRunAt).getTime() <= now
  );
}

export type { ScheduleEntry };
