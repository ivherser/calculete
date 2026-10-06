import { describe, expect, it } from "vitest";
import {
  expensesByConcept,
  monthlyBalance,
  normalizePercentages,
  adjustLeastRecent,
  arrayMove,
  safetyCushion,
} from "./balance";
import type { Entry } from "./types";

const e = (over: Partial<Entry>): Entry => ({
  id: crypto.randomUUID(),
  kind: "expense",
  concept: "x",
  amount: 0,
  periodicity: "mensual",
  months: [],
  ...over,
});

const entries: Entry[] = [
  e({ kind: "income", concept: "Nómina", amount: 2000, months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
  e({ concept: "Alquiler", amount: 800, months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
  e({ concept: "Seguro", amount: 600, periodicity: "anual", months: [2] }),
];

describe("monthlyBalance", () => {
  it("calcula neto y acumulado", () => {
    const res = monthlyBalance(entries);
    expect(res[0]).toMatchObject({ income: 2000, expense: 800, net: 1200, cumulative: 1200 });
    expect(res[2]).toMatchObject({ net: 600, cumulative: 3000 });
    expect(res[11].cumulative).toBe(24000 - 9600 - 600);
  });
});

describe("expensesByConcept", () => {
  it("ordena y agrupa en Otros", () => {
    const many = Array.from({ length: 8 }, (_, i) => e({ concept: `G${i}`, amount: i + 1, months: [0] }));
    const res = expensesByConcept(many, 3);
    expect(res.map((r) => r.name)).toEqual(["G7", "G6", "G5", "Otros"]);
    expect(res[3].value).toBe(1 + 2 + 3 + 4 + 5);
  });
});

describe("safetyCushion", () => {
  it("gasto medio mensual × 5, × 8 y × 13", () => {
    const { monthlyAverage, cushions } = safetyCushion(entries);
    const avg = (9600 + 600) / 12;
    expect(monthlyAverage).toBeCloseTo(avg);
    expect(cushions.map((c) => c.months)).toEqual([5, 8, 13]);
    cushions.forEach((c) => expect(c.amount).toBeCloseTo(avg * c.months));
  });
});

describe("percentages", () => {
  it("normaliza a 100", () => {
    expect(normalizePercentages([1, 1, 2])).toEqual([25, 25, 50]);
    expect(normalizePercentages([0, 0, 0]).reduce((a, b) => a + b)).toBeCloseTo(100);
  });
});

describe("adjustLeastRecent", () => {
  it("solo mueve el concepto tocado hace más tiempo", () => {
    const res = adjustLeastRecent([40, 30, 30], 0, 50, [0, 1, 2]);
    expect(res.values).toEqual([50, 20, 30]);
    expect(res.touchOrder).toEqual([1, 2, 0]);
    const res2 = adjustLeastRecent(res.values, 2, 40, res.touchOrder);
    expect(res2.values).toEqual([50, 10, 40]);
    expect(res2.touchOrder).toEqual([1, 0, 2]);
  });
  it("si el menos reciente llega a 0, el resto pasa al siguiente", () => {
    const res = adjustLeastRecent([40, 30, 30], 0, 80, [1, 2, 0]);
    expect(res.values).toEqual([80, 0, 20]);
  });
  it("al bajar, el menos reciente absorbe el excedente", () => {
    expect(adjustLeastRecent([40, 30, 30], 1, 10, [2, 0, 1]).values).toEqual([40, 10, 50]);
  });
});

describe("arrayMove", () => {
  it("mueve hacia abajo y hacia arriba", () => {
    expect(arrayMove(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(arrayMove(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
});
