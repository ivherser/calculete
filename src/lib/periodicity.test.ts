import { describe, expect, it } from "vitest";
import { buildPattern, repattern, toggleMonth } from "./periodicity";

describe("buildPattern", () => {
  it("mensual marca los 12 meses", () => {
    expect(buildPattern(4, "mensual")).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it("trimestral desde ENE", () => {
    expect(buildPattern(0, "trimestral")).toEqual([0, 3, 6, 9]);
  });
  it("trimestral desde NOV es cíclico", () => {
    expect(buildPattern(10, "trimestral")).toEqual([1, 4, 7, 10]);
  });
  it("bimensual desde FEB", () => {
    expect(buildPattern(1, "bimensual")).toEqual([1, 3, 5, 7, 9, 11]);
  });
  it("cuatrimestral desde OCT es cíclico", () => {
    expect(buildPattern(9, "cuatrimestral")).toEqual([1, 5, 9]);
  });
  it("semestral, anual y puntual", () => {
    expect(buildPattern(8, "semestral")).toEqual([2, 8]);
    expect(buildPattern(5, "anual")).toEqual([5]);
    expect(buildPattern(5, "puntual")).toEqual([5]);
  });
});

describe("toggleMonth", () => {
  it("primer clic autocompleta", () => {
    expect(toggleMonth({ months: [], periodicity: "trimestral" }, 1)).toEqual([1, 4, 7, 10]);
  });
  it("clic en otro mes recalcula desde ese mes", () => {
    expect(toggleMonth({ months: [1, 4, 7, 10], periodicity: "trimestral" }, 2)).toEqual([2, 5, 8, 11]);
  });
  it("puntual permite marcar meses sueltos", () => {
    expect(toggleMonth({ months: [2], periodicity: "puntual" }, 7)).toEqual([2, 7]);
    expect(toggleMonth({ months: [2, 7], periodicity: "puntual" }, 0)).toEqual([0, 2, 7]);
  });
  it("clic en mes marcado lo desmarca", () => {
    expect(toggleMonth({ months: [1, 4, 7, 10], periodicity: "trimestral" }, 4)).toEqual([1, 7, 10]);
  });
});

describe("repattern", () => {
  it("recalcula desde el primer mes marcado", () => {
    expect(repattern([2, 5], "semestral")).toEqual([2, 8]);
    expect(repattern([], "mensual")).toEqual([]);
    expect(repattern([1, 4, 7, 10], "puntual")).toEqual([1, 4, 7, 10]);
  });
});
