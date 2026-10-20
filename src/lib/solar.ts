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

/**
 * Irradiación extraterrestre diaria (relativa) sobre un plano orientado al sur con inclinación `tilt`
 * (fórmula de Klein para superficies inclinadas).
 */
export function dailyTiltedIrradiation(latitude: number, tilt: number, n: number): number {
  const phi = latitude * DEG;
  const delta = solarDeclination(n) * DEG;
  const eff = (latitude - tilt) * DEG;
  const clampCos = (x: number) => Math.acos(Math.min(1, Math.max(-1, x)));
  const sunset = clampCos(-Math.tan(phi) * Math.tan(delta));
  const sunsetTilted = Math.min(sunset, clampCos(-Math.tan(eff) * Math.tan(delta)));
  const value = Math.cos(eff) * Math.cos(delta) * Math.sin(sunsetTilted) + sunsetTilted * Math.sin(eff) * Math.sin(delta);
  return Math.max(0, value);
}

/** Inclinación fija que maximiza la irradiación recibida en cada periodo (búsqueda en pasos de 0,1°). */
export function seasonalOptimalTilts(latitude: number): Record<Season, number> {
  const days: Record<Season, number[]> = { invierno: [], primavera: [], verano: [], otono: [] };
  for (let n = 1; n <= DAYS_IN_YEAR; n++) days[seasonOfDay(n)].push(n);
  const result = { invierno: 0, primavera: 0, verano: 0, otono: 0 };
  for (const s of SEASONS) {
    let best = -Infinity;
    for (let t = 0; t <= 900; t++) {
      const tilt = t / 10;
      const total = days[s].reduce((acc, n) => acc + dailyTiltedIrradiation(latitude, tilt, n), 0);
      if (total > best) {
        best = total;
        result[s] = tilt;
      }
    }
  }
  return result;
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
