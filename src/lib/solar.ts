const DEG = Math.PI / 180;

export const DAYS_IN_YEAR = 365;

/** Latitud por defecto: Madrid. */
export const DEFAULT_LATITUDE = 40.4;

/** Día del año (1–365) del primer día de cada mes en un año no bisiesto. */
export const MONTH_START_DAYS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export type Season = "invierno" | "primavera" | "verano" | "otono";

export const SEASONS: readonly Season[] = ["invierno", "primavera", "verano", "otono"];

export const SEASON_LABELS: Record<Season, string> = {
  invierno: "Invierno",
  primavera: "Primavera",
  verano: "Verano",
  otono: "Otoño",
};

/** Declinación solar en grados (fórmula de Cooper) para el día del año `n` (1–365). */
export function solarDeclination(n: number): number {
  return 23.45 * Math.sin((360 / DAYS_IN_YEAR) * (284 + n) * DEG);
}

const clampTilt = (deg: number) => Math.min(90, Math.max(0, deg));

/** Inclinación que deja el panel perpendicular al sol al mediodía solar (hemisferio norte, orientado al sur). */
export function dailyOptimalTilt(latitude: number, n: number): number {
  return clampTilt(latitude - solarDeclination(n));
}

/** Inclinación fija óptima anual (aproximación del IDAE: 3,7 + 0,69·φ). */
export function annualOptimalTilt(latitude: number): number {
  return clampTilt(3.7 + 0.69 * latitude);
}

/** Estación astronómica (hemisferio norte) del día del año `n`. */
export function seasonOfDay(n: number): Season {
  if (n >= 79 && n < 172) return "primavera"; // 20 mar – 20 jun
  if (n >= 172 && n < 266) return "verano"; // 21 jun – 22 sep
  if (n >= 266 && n < 355) return "otono"; // 23 sep – 20 dic
  return "invierno"; // 21 dic – 19 mar
}

/** Inclinación fija óptima para cada estación: media de la inclinación diaria a lo largo de la estación. */
export function seasonalOptimalTilts(latitude: number): Record<Season, number> {
  const sum: Record<Season, number> = { invierno: 0, primavera: 0, verano: 0, otono: 0 };
  const count: Record<Season, number> = { invierno: 0, primavera: 0, verano: 0, otono: 0 };
  for (let n = 1; n <= DAYS_IN_YEAR; n++) {
    const s = seasonOfDay(n);
    sum[s] += dailyOptimalTilt(latitude, n);
    count[s]++;
  }
  return {
    invierno: sum.invierno / count.invierno,
    primavera: sum.primavera / count.primavera,
    verano: sum.verano / count.verano,
    otono: sum.otono / count.otono,
  };
}

/** Día del año (1–365) de una fecha; el 29 de febrero se trata como el 28. */
export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  let n = Math.floor((current - start) / 86_400_000) + 1;
  const isLeap = new Date(date.getFullYear(), 1, 29).getMonth() === 1;
  if (isLeap && n > 59) n -= 1;
  return Math.min(Math.max(n, 1), DAYS_IN_YEAR);
}
