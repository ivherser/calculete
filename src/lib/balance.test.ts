import { describe, expect, it } from "vitest";
import {
  expensesByConcept,
  monthlyBalance,
  normalizePercentages,
  rebalancePercentages,
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
  it("gasto medio mensual × 9", () => {
    const { monthlyAverage, cushion } = safetyCushion(entries);
    expect(monthlyAverage).toBeCloseTo((9600 + 600) / 12);
    expect(cushion).toBeCloseTo(((9600 + 600) / 12) * 9);
  });
});

describe("percentages", () => {
  it("normaliza a 100", () => {
    expect(normalizePercentages([1, 1, 2])).toEqual([25, 25, 50]);
    expect(normalizePercentages([0, 0, 0]).reduce((a, b) => a + b)).toBeCloseTo(100);
  });
  it("rebalancea el resto proporcionalmente", () => {
    const res = rebalancePercentages([40, 30, 30], 0, 70);
    expect(res).toEqual([70, 15, 15]);
    expect(rebalancePercentages([100, 0, 0], 0, 50)).toEqual([50, 25, 25]);
  });
});
