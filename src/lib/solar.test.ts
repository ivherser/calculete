import { describe, expect, it } from "vitest";
import {
  annualOptimalTilt,
  dailyOptimalTilt,
  dayOfYear,
  dstRange,
  seasonOfDay,
  seasonalOptimalTilts,
  solarDeclination,
  solarNoonClockHour,
  spanishUtcOffset,
  sunClockHour,
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
  it("orders winter > autumn, spring > summer with plausible values", () => {
    const t = seasonalOptimalTilts(41.65);
    expect(t.invierno).toBeGreaterThan(t.otono);
    expect(t.invierno).toBeGreaterThan(t.primavera);
    expect(t.otono).toBeGreaterThan(t.verano);
    expect(t.primavera).toBeGreaterThan(t.verano);
    expect(t.invierno).toBeGreaterThan(50);
    expect(t.invierno).toBeLessThan(65);
    expect(t.verano).toBeGreaterThan(18);
    expect(t.verano).toBeLessThan(30);
  });

  it("is the mean of the daily optimum, within its min and max, for each period", () => {
    const t = seasonalOptimalTilts(41.65);
    for (const season of ["invierno", "primavera", "verano", "otono"] as const) {
      const daily: number[] = [];
      for (let n = 1; n <= 365; n++) if (seasonOfDay(n) === season) daily.push(dailyOptimalTilt(41.65, n));
      const mean = daily.reduce((a, b) => a + b, 0) / daily.length;
      expect(t[season]).toBeCloseTo(mean, 9);
      expect(t[season]).toBeGreaterThan(Math.min(...daily));
      expect(t[season]).toBeLessThan(Math.max(...daily));
    }
  });
});

describe("seasonOfDay", () => {
  it("uses the change dates 3 Mar, 17 Apr, 23 Aug and 6 Oct", () => {
    expect(seasonOfDay(dayOfYear(new Date(2026, 2, 2)))).toBe("invierno");
    expect(seasonOfDay(dayOfYear(new Date(2026, 2, 3)))).toBe("primavera");
    expect(seasonOfDay(dayOfYear(new Date(2026, 3, 16)))).toBe("primavera");
    expect(seasonOfDay(dayOfYear(new Date(2026, 3, 17)))).toBe("verano");
    expect(seasonOfDay(dayOfYear(new Date(2026, 7, 22)))).toBe("verano");
    expect(seasonOfDay(dayOfYear(new Date(2026, 7, 23)))).toBe("otono");
    expect(seasonOfDay(dayOfYear(new Date(2026, 9, 5)))).toBe("otono");
    expect(seasonOfDay(dayOfYear(new Date(2026, 9, 6)))).toBe("invierno");
    expect(seasonOfDay(1)).toBe("invierno");
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

describe("sun times", () => {
  const VALLADOLID = { lat: 41.65, lon: -4.72 };

  it("dstRange returns the last Sundays of March and October", () => {
    expect(dstRange(2026)).toEqual({ start: dayOfYear(new Date(2026, 2, 29)), end: dayOfYear(new Date(2026, 9, 25)) });
  });

  it("spanishUtcOffset is 2 in summer and 1 in winter", () => {
    const { start, end } = dstRange(2026);
    expect(spanishUtcOffset(start, 2026)).toBe(2);
    expect(spanishUtcOffset(end - 1, 2026)).toBe(2);
    expect(spanishUtcOffset(end, 2026)).toBe(1);
    expect(spanishUtcOffset(start - 1, 2026)).toBe(1);
  });

  it("matches real sunrise/sunset in Valladolid within a few minutes", () => {
    const jun21 = dayOfYear(new Date(2026, 5, 21));
    const dec21 = dayOfYear(new Date(2026, 11, 21));
    expect(sunClockHour(VALLADOLID.lat, VALLADOLID.lon, jun21, 2026, -1)).toBeCloseTo(6.75, 1);
    expect(sunClockHour(VALLADOLID.lat, VALLADOLID.lon, jun21, 2026, 1)).toBeCloseTo(21.9, 1);
    expect(sunClockHour(VALLADOLID.lat, VALLADOLID.lon, dec21, 2026, -1)).toBeCloseTo(8.7, 1);
    expect(sunClockHour(VALLADOLID.lat, VALLADOLID.lon, dec21, 2026, 1)).toBeCloseTo(17.9, 1);
  });

  it("solar noon is about 13h in winter and 14h in summer for Valladolid", () => {
    const jun21 = dayOfYear(new Date(2026, 5, 21));
    const dec21 = dayOfYear(new Date(2026, 11, 21));
    expect(solarNoonClockHour(VALLADOLID.lon, jun21, 2026)).toBeCloseTo(14.3, 1);
    expect(solarNoonClockHour(VALLADOLID.lon, dec21, 2026)).toBeCloseTo(13.3, 1);
  });
});
