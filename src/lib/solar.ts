const DEG = Math.PI / 180;

export const DAYS_IN_YEAR = 365;

/** Latitud por defecto: Valladolid. */
export const DEFAULT_LATITUDE = 41.65;

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

/** Días del año en que se cambia la inclinación: 3 mar, 17 abr, 23 ago y 6 oct. */
export const SEASON_START_DAYS: Record<Season, number> = { primavera: 62, verano: 107, otono: 235, invierno: 279 };

/** Periodo (estación) de inclinación al que pertenece el día del año `n`. */
export function seasonOfDay(n: number): Season {
  if (n >= SEASON_START_DAYS.primavera && n < SEASON_START_DAYS.verano) return "primavera";
  if (n >= SEASON_START_DAYS.verano && n < SEASON_START_DAYS.otono) return "verano";
  if (n >= SEASON_START_DAYS.otono && n < SEASON_START_DAYS.invierno) return "otono";
  return "invierno";
}

/** Inclinación fija para cada periodo: media del óptimo diario a lo largo del periodo. */
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

/** Longitud por defecto: Valladolid (grados este; oeste negativo). */
export const DEFAULT_LONGITUDE = -4.72;

/** Ecuación del tiempo en minutos (aproximación) para el día del año `n`. */
export function equationOfTime(n: number): number {
  const b = ((360 / DAYS_IN_YEAR) * (n - 81)) * DEG;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/** Mediodía solar en horas UTC para una longitud en grados este. */
export function solarNoonUtc(n: number, longitude: number): number {
  return 12 - longitude / 15 - equationOfTime(n) / 60;
}

/**
 * Ángulo horario de salida/puesta del sol en grados, contando la depresión de
 * 0,833° (refracción + tamaño del disco). null si ese día no hay orto ni ocaso.
 */
export function daylightHourAngle(latitude: number, n: number): number | null {
  const phi = latitude * DEG;
  const delta = solarDeclination(n) * DEG;
  const cosW = (Math.sin(-0.833 * DEG) - Math.sin(phi) * Math.sin(delta)) / (Math.cos(phi) * Math.cos(delta));
  if (cosW < -1 || cosW > 1) return null;
  return Math.acos(cosW) / DEG;
}

/** Primer y último día del año en horario de verano (CEST) en España para el año dado. */
export function dstRange(year: number): { start: number; end: number } {
  const lastSunday = (monthIndex: number) => {
    const d = new Date(Date.UTC(year, monthIndex + 1, 0));
    while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() - 1);
    return Math.floor((d.getTime() - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
  };
  return { start: lastSunday(2), end: lastSunday(9) };
}

/** Desfase horario español en horas UTC para el día `n` del año `year` (1 en CET, 2 en CEST). */
export function spanishUtcOffset(n: number, year: number): number {
  const { start, end } = dstRange(year);
  return n >= start && n < end ? 2 : 1;
}

/**
 * Hora oficial española (decimal) de salida (`sign = -1`) o puesta (`sign = 1`)
 * del sol el día `n` del año `year`. null si ese día no hay orto ni ocaso.
 */
export function sunClockHour(
  latitude: number,
  longitude: number,
  n: number,
  year: number,
  sign: -1 | 1,
): number | null {
  const w = daylightHourAngle(latitude, n);
  if (w === null) return null;
  return solarNoonUtc(n, longitude) + spanishUtcOffset(n, year) + (sign * w) / 15;
}

/** Mediodía solar en hora oficial española para el día `n` del año `year`. */
export function solarNoonClockHour(longitude: number, n: number, year: number): number {
  return solarNoonUtc(n, longitude) + spanishUtcOffset(n, year);
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
