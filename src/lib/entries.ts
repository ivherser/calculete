import { z } from "zod";
import { PERIODICITIES, type Entry, type EntryKind } from "./types";

export const MAX_CONCEPT_LENGTH = 120;
export const MAX_AMOUNT = 1_000_000_000;
export const MAX_ENTRIES = 500;

const monthsSchema = z
  .array(z.number().int().min(0).max(11))
  .max(12)
  .transform((ms) => [...new Set(ms)].sort((a, b) => a - b));

export const entrySchema = z.object({
  id: z.uuid(),
  kind: z.enum(["income", "expense"]),
  concept: z.string().max(MAX_CONCEPT_LENGTH),
  amount: z.coerce.number().finite().min(0).max(MAX_AMOUNT),
  periodicity: z.enum(PERIODICITIES),
  months: monthsSchema,
});

export const entriesSchema = z.array(entrySchema).max(MAX_ENTRIES);

/** Fila tal y como se guarda en la tabla `public.entries`. */
export interface EntryRow {
  id: string;
  user_id: string;
  kind: EntryKind;
  concept: string;
  amount: number | string;
  periodicity: string;
  months: number[];
  position: number;
}

/** Valida datos externos (localStorage, Supabase) descartando las filas inválidas. */
export function parseEntries(input: unknown): Entry[] {
  if (!Array.isArray(input)) return [];
  const out: Entry[] = [];
  for (const item of input.slice(0, MAX_ENTRIES)) {
    const parsed = entrySchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export function rowsToEntries(rows: EntryRow[]): Entry[] {
  const sorted = [...rows].sort((a, b) => a.position - b.position);
  return parseEntries(sorted);
}

export function entryToRow(entry: Entry, userId: string, position: number): EntryRow {
  return {
    id: entry.id,
    user_id: userId,
    kind: entry.kind,
    concept: entry.concept.slice(0, MAX_CONCEPT_LENGTH),
    amount: entry.amount,
    periodicity: entry.periodicity,
    months: entry.months,
    position,
  };
}

export function newEntry(kind: EntryKind): Entry {
  return {
    id: crypto.randomUUID(),
    kind,
    concept: "",
    amount: 0,
    periodicity: "mensual",
    months: [],
  };
}
