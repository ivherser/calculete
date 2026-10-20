import { describe, expect, it } from "vitest";
import {
  annualOptimalTilt,
  dailyOptimalTilt,
  dayOfYear,
  seasonOfDay,
  seasonalOptimalTilts,
  solarDeclination,
} from "./solar";

describe("solarDeclination", () => {
  it("is close to +23.45° at the June solstice and -23.45° at the December solstice", () => {
    expect(solarDeclination(172)).toBeCloseTo(23.45, 0);
    expect(solarDeclination(355)).toBeCloseTo(-23.45, 0);
  });

  it("is close to 0° at the equinoxes", () => {
    expect(Math.abs(solarDeclination(81))).toBeLessThan(1);
    expect(Math.abs(solarDeclination(264))).toBeLessThan(1.5);
  });
});

describe("dailyOptimalTilt", () => {
  it("is latitude minus declination", () => {
    expect(dailyOptimalTilt(40, 172)).toBeCloseTo(40 - solarDeclination(172), 6);
    expect(dailyOptimalTilt(40, 355)).toBeCloseTo(63.45, 0);
  });

  it("is clamped to 0–90°", () => {
    expect(dailyOptimalTilt(5, 172)).toBe(0);
    expect(dailyOptimalTilt(80, 355)).toBe(90);
  });
});

describe("annualOptimalTilt", () => {
  it("follows 3.7 + 0.69·latitude", () => {
    expect(annualOptimalTilt(40)).toBeCloseTo(31.3, 6);
  });
});

describe("seasonalOptimalTilts", () => {
  it("orders winter > autumn ≈ spring > summer", () => {
    const t = seasonalOptimalTilts(40);
    expect(t.invierno).toBeGreaterThan(t.otono);
    expect(t.otono).toBeGreaterThan(t.verano);
    expect(t.primavera).toBeGreaterThan(t.verano);
    expect(t.invierno).toBeGreaterThan(50);
    expect(t.invierno).toBeLessThan(60);
    expect(t.verano).toBeGreaterThan(20);
    expect(t.verano).toBeLessThan(30);
  });
});

describe("seasonOfDay", () => {
  it("maps astronomical seasons", () => {
    expect(seasonOfDay(1)).toBe("invierno");
    expect(seasonOfDay(100)).toBe("primavera");
    expect(seasonOfDay(200)).toBe("verano");
    expect(seasonOfDay(300)).toBe("otono");
    expect(seasonOfDay(360)).toBe("invierno");
  });
});

describe("dayOfYear", () => {
  it("returns 1 for January 1st and 365 for December 31st", () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1);
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365);
  });

  it("keeps the same day number in leap years", () => {
    expect(dayOfYear(new Date(2028, 2, 1))).toBe(60);
    expect(dayOfYear(new Date(2028, 11, 31))).toBe(365);
  });
});
