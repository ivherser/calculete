import type { Entry } from "./types";

export const SAFETY_CUSHION_MONTHS = 9;

export function annualAmount(entry: Pick<Entry, "amount" | "months">): number {
  return entry.amount * entry.months.length;
}

export function monthlyTotals(entries: Entry[]): number[] {
  const totals = Array<number>(12).fill(0);
  for (const e of entries) for (const m of e.months) totals[m] += e.amount;
  return totals;
}

export interface MonthlyBalance {
  month: number;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
}

export function monthlyBalance(entries: Entry[]): MonthlyBalance[] {
  const income = monthlyTotals(entries.filter((e) => e.kind === "income"));
  const expense = monthlyTotals(entries.filter((e) => e.kind === "expense"));
  let cumulative = 0;
  return income.map((inc, month) => {
    const net = inc - expense[month];
    cumulative += net;
    return { month, income: inc, expense: expense[month], net, cumulative };
  });
}

export interface ConceptTotal {
  name: string;
  value: number;
}

/** Gastos anuales agrupados por concepto; los que exceden `top` se agrupan en "Otros". */
export function expensesByConcept(entries: Entry[], top = 6): ConceptTotal[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.kind !== "expense") continue;
    const value = annualAmount(e);
    if (value <= 0) continue;
    const name = e.concept.trim() || "Sin concepto";
    map.set(name, (map.get(name) ?? 0) + value);
  }
  const sorted = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  if (sorted.length <= top) return sorted;
  const rest = sorted.slice(top).reduce((acc, c) => acc + c.value, 0);
  return [...sorted.slice(0, top), { name: "Otros", value: rest }];
}

export function safetyCushion(entries: Entry[]): { monthlyAverage: number; cushion: number } {
  const annualExpense = entries
    .filter((e) => e.kind === "expense")
    .reduce((acc, e) => acc + annualAmount(e), 0);
  const monthlyAverage = annualExpense / 12;
  return { monthlyAverage, cushion: monthlyAverage * SAFETY_CUSHION_MONTHS };
}

/** Normaliza pesos arbitrarios (≥ 0) para que sumen 100. Si todos son 0, reparte a partes iguales. */
export function normalizePercentages(weights: number[]): number[] {
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  if (sum === 0) return clean.map(() => 100 / clean.length);
  return clean.map((w) => (w / sum) * 100);
}

/**
 * Fija el porcentaje `index` a `value` y compensa la diferencia para sumar 100 modificando
 * solo el concepto tocado hace más tiempo (según `touchOrder`, de menos a más reciente).
 * Si ese concepto llega a 0 o 100, el resto pasa al siguiente menos reciente.
 */
export function adjustLeastRecent(
  current: number[],
  index: number,
  value: number,
  touchOrder: number[],
): { values: number[]; touchOrder: number[] } {
  const values = current.map((v) => Math.min(100, Math.max(0, v)));
  values[index] = Math.min(100, Math.max(0, value));
  let excess = values.reduce((a, b) => a + b, 0) - 100;
  for (const i of touchOrder) {
    if (Math.abs(excess) < 1e-9) break;
    if (i === index) continue;
    const next = Math.min(100, Math.max(0, values[i] - excess));
    excess -= values[i] - next;
    values[i] = next;
  }
  return { values, touchOrder: [...touchOrder.filter((i) => i !== index), index] };
}

/** Mueve un elemento de `from` a `to` (índices del array original). */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
