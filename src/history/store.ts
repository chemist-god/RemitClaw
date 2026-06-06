import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { TransferRecord } from "../types/index.js";

function ensureDataDir(dataDir: string): void {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
}

function transactionsPath(dataDir: string): string {
  return join(dataDir, "transactions.json");
}

export function loadTransactions(dataDir: string): TransferRecord[] {
  ensureDataDir(dataDir);
  const path = transactionsPath(dataDir);
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf-8")) as TransferRecord[];
}

export function saveTransaction(
  dataDir: string,
  record: TransferRecord
): void {
  const records = loadTransactions(dataDir);
  records.push(record);
  writeFileSync(transactionsPath(dataDir), JSON.stringify(records, null, 2));
}

export function getDailySpentUsd(dataDir: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return loadTransactions(dataDir)
    .filter(
      (r) =>
        r.status === "confirmed" &&
        r.createdAt.startsWith(today)
    )
    .reduce((sum, r) => sum + r.intent.amount, 0);
}

export function getReceipt(dataDir: string, id: string): TransferRecord | undefined {
  return loadTransactions(dataDir).find((r) => r.id === id);
}
