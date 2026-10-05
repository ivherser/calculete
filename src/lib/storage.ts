import { parseEntries } from "./entries";
import type { Entry } from "./types";

const ENTRIES_KEY = "calculete:entries:v1";
const DISTRIBUTION_KEY = "calculete:distribution:v1";
const MIGRATION_KEY_PREFIX = "calculete:migration-asked:";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // localStorage no disponible (modo privado, cuota...): se ignora.
  }
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadLocalEntries(): Entry[] {
  return parseEntries(safeParse(safeGet(ENTRIES_KEY)));
}

export function saveLocalEntries(entries: Entry[]): void {
  safeSet(ENTRIES_KEY, JSON.stringify(entries));
}

export function clearLocalEntries(): void {
  safeSet(ENTRIES_KEY, null);
}

export const DEFAULT_DISTRIBUTION = [40, 30, 30];

export function loadDistribution(): number[] {
  const value = safeParse(safeGet(DISTRIBUTION_KEY));
  if (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100)
  ) {
    return value;
  }
  return DEFAULT_DISTRIBUTION;
}

export function saveDistribution(values: number[]): void {
  safeSet(DISTRIBUTION_KEY, JSON.stringify(values));
}

export function wasMigrationAsked(userId: string): boolean {
  return safeGet(MIGRATION_KEY_PREFIX + userId) === "1";
}

export function markMigrationAsked(userId: string): void {
  safeSet(MIGRATION_KEY_PREFIX + userId, "1");
}
