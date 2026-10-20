import { describe, expect, it } from "vitest";
import {
  applyEdit,
  DEFAULT_TRIANGLE,
  solveRightTriangle,
  solveTriangle,
  switchMode,
  triangleArea,
  usedKeys,
  type Triangle,
} from "./triangle";

function expectTriangle(actual: Triangle, expected: Partial<Triangle>) {
  for (const [k, v] of Object.entries(expected)) expect(actual[k as keyof Triangle]).toBeCloseTo(v, 6);
  expect(actual.A + actual.B + actual.C).toBeCloseTo(180, 9);
}

function solved(result: ReturnType<typeof solveTriangle>): Triangle[] {
  if (!result.ok) throw new Error(result.error);
  return result.solutions;
}

describe("solveRightTriangle", () => {
  it("solves from both legs", () => {
    const [t] = solved(solveRightTriangle({ b: 3, c: 4 }));
    expectTriangle(t, { a: 5, A: 90, B: 36.86989765, C: 53.13010235 });
  });

  it("solves from hypotenuse and an angle", () => {
    const [t] = solved(solveRightTriangle({ a: 10, B: 30 }));
    expectTriangle(t, { b: 5, c: Math.sqrt(75), C: 60 });
  });

  it("solves from a leg and the hypotenuse", () => {
    const [t] = solved(solveRightTriangle({ b: 5, a: 13 }));
    expectTriangle(t, { c: 12 });
  });

  it("rejects a leg longer than the hypotenuse", () => {
    const r = solveRightTriangle({ b: 6, a: 5 });
    expect(r.ok).toBe(false);
  });

  it("rejects angles only", () => {
    expect(solveRightTriangle({ B: 30, C: 60 }).ok).toBe(false);
    expect(solveRightTriangle({ B: 40, C: 60 })).toEqual({ ok: false, error: expect.stringContaining("90°") });
  });

  it("requires exactly two values", () => {
    expect(solveRightTriangle({ b: 3 }).ok).toBe(false);
    expect(solveRightTriangle({ a: 3, b: 4, c: 5 }).ok).toBe(false);
  });
});

describe("solveTriangle", () => {
  it("solves SSS", () => {
    const [t] = solved(solveTriangle({ a: 7, b: 8, c: 9 }));
    expectTriangle(t, { A: 48.18968511, B: 58.41186449, C: 73.39845040 });
  });

  it("rejects sides that violate the triangle inequality", () => {
    expect(solveTriangle({ a: 1, b: 2, c: 3 }).ok).toBe(false);
  });

  it("solves SAS", () => {
    const [t] = solved(solveTriangle({ b: 5, c: 7, A: 60 }));
    expectTriangle(t, { a: Math.sqrt(39) });
  });

  it("solves ASA and AAS", () => {
    const [asa] = solved(solveTriangle({ A: 50, B: 60, c: 10 }));
    expectTriangle(asa, { C: 70, a: (10 * Math.sin((50 * Math.PI) / 180)) / Math.sin((70 * Math.PI) / 180) });
    const [aas] = solved(solveTriangle({ A: 30, B: 60, a: 1 }));
    expectTriangle(aas, { C: 90, b: Math.sqrt(3), c: 2 });
  });

  it("returns two solutions in the ambiguous SSA case", () => {
    const solutions = solved(solveTriangle({ a: 6, b: 8, A: 35 }));
    expect(solutions).toHaveLength(2);
    expect(solutions[0].B + solutions[1].B).toBeCloseTo(180, 9);
  });

  it("returns one solution in the SSA case when the opposite side is the longest", () => {
    expect(solved(solveTriangle({ a: 10, b: 8, A: 35 }))).toHaveLength(1);
  });

  it("rejects SSA without solution", () => {
    expect(solveTriangle({ a: 2, b: 8, A: 35 }).ok).toBe(false);
  });

  it("rejects three angles", () => {
    const wrong = solveTriangle({ A: 50, B: 60, C: 80 });
    expect(wrong).toEqual({ ok: false, error: expect.stringContaining("180°") });
    expect(solveTriangle({ A: 50, B: 60, C: 70 }).ok).toBe(false);
  });

  it("rejects two angles summing 180° or more", () => {
    expect(solveTriangle({ A: 100, B: 80, a: 3 }).ok).toBe(false);
  });

  it("rejects non-positive values and wrong counts", () => {
    expect(solveTriangle({ a: 0, b: 1, c: 1 }).ok).toBe(false);
    expect(solveTriangle({ a: 1, b: 1 }).ok).toBe(false);
    expect(solveTriangle({ a: 1, b: 1, c: 1, A: 60 }).ok).toBe(false);
  });
});

describe("triangleArea", () => {
  it("computes the area", () => {
    const [t] = solved(solveRightTriangle({ b: 3, c: 4 }));
    expect(triangleArea(t)).toBeCloseTo(6, 9);
  });
});

describe("usedKeys", () => {
  it("takes the last 2 or 3 editable keys", () => {
    expect(usedKeys(["a", "b", "c"], true)).toEqual(["b", "c"]);
    expect(usedKeys(["b", "c", "A"], true)).toEqual(["b", "c"]);
    expect(usedKeys(["a", "b"], false)).toEqual(["c", "a", "b"]);
  });
});

describe("applyEdit", () => {
  it("defaults to the 3-4-5 right triangle", () => {
    expectTriangle(DEFAULT_TRIANGLE, { a: 5, b: 3, c: 4, A: 90 });
  });

  it("recalculates with the last two values in right mode", () => {
    const r = applyEdit(DEFAULT_TRIANGLE, ["b", "c"], "a", 13, true);
    if (!r.ok) throw new Error(r.error);
    expect(r.history).toEqual(["c", "a"]);
    expect(r.adjusted).toBeNull();
    expectTriangle(r.triangle, { c: 4, a: 13, b: Math.sqrt(153) });
  });

  it("adjusts the penultimate value when the last one is incompatible", () => {
    const r = applyEdit(DEFAULT_TRIANGLE, ["b", "c"], "a", 2, true);
    if (!r.ok) throw new Error(r.error);
    expect(r.adjusted).toBe("c");
    expectTriangle(r.triangle, { a: 2, b: 1.2, c: 1.6 });
  });

  it("adjusts the penultimate angle when two angles exceed 180°", () => {
    const start = applyEdit(DEFAULT_TRIANGLE, ["a", "b", "c"], "A", 100, false);
    if (!start.ok) throw new Error(start.error);
    const r = applyEdit(start.triangle, start.history, "B", 90, false);
    if (!r.ok) throw new Error(r.error);
    expect(r.adjusted).toBe("A");
    expect(r.triangle.B).toBeCloseTo(90, 9);
    expect(r.triangle.A + r.triangle.B + r.triangle.C).toBeCloseTo(180, 9);
  });

  it("keeps the solution closest to the current one in the ambiguous case", () => {
    const base = solved(solveTriangle({ a: 6, b: 8, A: 35 }))[1];
    const r = applyEdit(base, ["a", "b", "A"], "A", 35.5, false);
    if (!r.ok) throw new Error(r.error);
    expect(r.triangle.B).toBeGreaterThan(90);
  });
});

describe("switchMode", () => {
  it("forces α = 90° when switching to right mode", () => {
    const r = switchMode({ ...solved(solveTriangle({ a: 6, b: 4, c: 5 }))[0] }, ["a", "b", "c"], true);
    expect(r.triangle.A).toBeCloseTo(90, 9);
    expect(r.history).toEqual(["b", "c"]);
  });
});
