import { describe, expect, it } from "vitest";
import { parseEntries } from "./entries";

describe("parseEntries", () => {
  it("descarta filas inválidas y normaliza meses", () => {
    const valid = {
      id: "6f1c1b2e-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
      kind: "income",
      concept: "Nómina",
      amount: "1500.50",
      periodicity: "mensual",
      months: [3, 1, 1],
    };
    const res = parseEntries([valid, { ...valid, id: "nope" }, { ...valid, months: [12] }, null]);
    expect(res).toHaveLength(1);
    expect(res[0].amount).toBe(1500.5);
    expect(res[0].months).toEqual([1, 3]);
  });
  it("entrada no array → vacío", () => {
    expect(parseEntries({})).toEqual([]);
  });
});
