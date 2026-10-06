import type { Entry, Periodicity } from "./types";

const STEP: Record<Periodicity, number | null> = {
  mensual: 1,
  bimensual: 2,
  trimestral: 3,
  cuatrimestral: 4,
  semestral: 6,
  anual: 12,
  puntual: null,
};

/**
 * Meses en los que aplica un concepto empezando en `start`.
 * El patrón es cíclico sobre el año (trimestral desde NOV → NOV, FEB, MAY, AGO).
 */
export function buildPattern(start: number, periodicity: Periodicity): number[] {
  const step = STEP[periodicity];
  if (step === null) return [start];
  const months = new Set<number>();
  for (let m = start; m < start + 12; m += step) months.add(m % 12);
  return [...months].sort((a, b) => a - b);
}

/**
 * Clic en un mes de la matriz:
 *  - si el mes ya está marcado, se desmarca (solo ese mes);
 *  - en «puntual» se marca solo ese mes, sin tocar los demás (selección libre);
 *  - si no, se recalcula el patrón completo desde ese mes.
 */
export function toggleMonth(entry: Pick<Entry, "months" | "periodicity">, month: number): number[] {
  if (entry.months.includes(month)) return entry.months.filter((m) => m !== month);
  if (STEP[entry.periodicity] === null) return [...entry.months, month].sort((a, b) => a - b);
  return buildPattern(month, entry.periodicity);
}

/** Al cambiar la periodicidad se recalcula desde el primer mes marcado (si lo hay); «puntual» conserva los meses. */
export function repattern(months: number[], periodicity: Periodicity): number[] {
  if (months.length === 0) return [];
  if (STEP[periodicity] === null) return months;
  return buildPattern(Math.min(...months), periodicity);
}
