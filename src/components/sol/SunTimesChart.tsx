"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DAYS_IN_YEAR,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  dayOfYear,
  dstRange,
  MONTH_START_DAYS,
  solarNoonClockHour,
  sunClockHour,
} from "@/lib/solar";
import { MONTH_LABELS } from "@/lib/types";

const noopSubscribe = () => () => {};
const getToday = () => dayOfYear(new Date());
const getYear = () => new Date().getFullYear();
const getServerNull = () => null;

function dayLabel(n: number): string {
  let month = 0;
  while (month < 11 && MONTH_START_DAYS[month + 1] <= n) month++;
  return `${n - MONTH_START_DAYS[month] + 1} ${MONTH_LABELS[month]}`;
}

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 60 ? `${hh + 1}:00` : `${hh}:${String(mm).padStart(2, "0")}`;
}

export function SunTimesChart() {
  const today = useSyncExternalStore(noopSubscribe, getToday, getServerNull);
  const year = useSyncExternalStore(noopSubscribe, getYear, getServerNull);
  const [latitudeRaw, setLatitudeRaw] = useState(String(DEFAULT_LATITUDE).replace(".", ","));
  const [longitudeRaw, setLongitudeRaw] = useState(String(DEFAULT_LONGITUDE).replace(".", ","));

  const parsedLat = Number(latitudeRaw.replace(",", "."));
  const latitudeValid = latitudeRaw.trim() !== "" && Number.isFinite(parsedLat) && parsedLat >= -66 && parsedLat <= 66;
  const latitude = latitudeValid ? parsedLat : DEFAULT_LATITUDE;
  const parsedLon = Number(longitudeRaw.replace(",", "."));
  const longitudeValid = longitudeRaw.trim() !== "" && Number.isFinite(parsedLon) && parsedLon >= -180 && parsedLon <= 180;
  const longitude = longitudeValid ? parsedLon : DEFAULT_LONGITUDE;

  const { data, noonWinter, noonSummer, dst } = useMemo(() => {
    if (year === null) return { data: [], noonWinter: null, noonSummer: null, dst: null };
    const dst = dstRange(year);
    const data = Array.from({ length: DAYS_IN_YEAR }, (_, i) => {
      const day = i + 1;
      return {
        day,
        salida: sunClockHour(latitude, longitude, day, year, -1),
        puesta: sunClockHour(latitude, longitude, day, year, 1),
      };
    });
    const noonOf = (n: number) => solarNoonClockHour(longitude, n, year);
    const winterDays = data.filter((d) => d.day < dst.start || d.day >= dst.end);
    const summerDays = data.filter((d) => d.day >= dst.start && d.day < dst.end);
    const mean = (days: { day: number }[]) => days.reduce((s, d) => s + noonOf(d.day), 0) / days.length;
    return { data, noonWinter: mean(winterDays), noonSummer: mean(summerDays), dst };
  }, [latitude, longitude, year]);

  const todaySun =
    today === null || year === null
      ? null
      : { salida: sunClockHour(latitude, longitude, today, year, -1), puesta: sunClockHour(latitude, longitude, today, year, 1) };

  const yTicks = [6, 8, 10, 12, 14, 16, 18, 20, 22];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm text-slate-600">
          Latitud (°N)
          <input
            type="text"
            inputMode="decimal"
            value={latitudeRaw}
            onChange={(e) => setLatitudeRaw(e.target.value)}
            aria-invalid={!latitudeValid}
            className={`mt-1 block w-28 rounded-lg border px-3 py-1.5 text-slate-900 ${latitudeValid ? "border-slate-300" : "border-rose-400 bg-rose-50"}`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Longitud (°E)
          <input
            type="text"
            inputMode="decimal"
            value={longitudeRaw}
            onChange={(e) => setLongitudeRaw(e.target.value)}
            aria-invalid={!longitudeValid}
            className={`mt-1 block w-28 rounded-lg border px-3 py-1.5 text-slate-900 ${longitudeValid ? "border-slate-300" : "border-rose-400 bg-rose-50"}`}
          />
        </label>
        {(!latitudeValid || !longitudeValid) && (
          <p className="text-sm text-rose-700">Latitud entre −66 y 66°, longitud entre −180 y 180°.</p>
        )}
        {today !== null && todaySun?.salida != null && todaySun?.puesta != null && (
          <p className="text-sm text-slate-700">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-600 align-middle" />
            Hoy ({dayLabel(today)}): sale <strong>{formatHour(todaySun.salida)}</strong> y se pone{" "}
            <strong>{formatHour(todaySun.puesta)}</strong>
          </p>
        )}
      </div>

      <div className="h-80 w-full">
        {year === null ? (
          <p className="py-20 text-center text-slate-400">Cargando…</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                type="number"
                domain={[1, DAYS_IN_YEAR]}
                ticks={MONTH_START_DAYS}
                tickFormatter={(d: number) => MONTH_LABELS[MONTH_START_DAYS.indexOf(d)] ?? ""}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[5, 23]}
                ticks={yTicks}
                tickFormatter={(v: number) => `${v}h`}
                tick={{ fontSize: 12 }}
                width={44}
              />
              <Tooltip
                labelFormatter={(d) => `${dayLabel(Number(d))} (día ${d})`}
                formatter={(v) => (typeof v === "number" ? formatHour(v) : "—")}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="salida"
                name="Salida del sol"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="puesta"
                name="Puesta del sol"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              {noonWinter !== null && (
                <ReferenceLine
                  y={noonWinter}
                  stroke="#0ea5e9"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: `Mediodía inv. ${formatHour(noonWinter)}`, position: "insideBottomRight", fontSize: 11, fill: "#0369a1" }}
                />
              )}
              {noonSummer !== null && (
                <ReferenceLine
                  y={noonSummer}
                  stroke="#0369a1"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: `Mediodía ver. ${formatHour(noonSummer)}`, position: "insideTopLeft", fontSize: 11, fill: "#0369a1" }}
                />
              )}
              {dst && (
                <>
                  <ReferenceLine
                    x={dst.start}
                    stroke="#94a3b8"
                    strokeDasharray="2 3"
                    label={{ value: "Hora verano", position: "insideTopRight", fontSize: 11, fill: "#64748b" }}
                  />
                  <ReferenceLine
                    x={dst.end}
                    stroke="#94a3b8"
                    strokeDasharray="2 3"
                    label={{ value: "Hora invierno", position: "insideTopRight", fontSize: 11, fill: "#64748b" }}
                  />
                </>
              )}
              {today !== null && todaySun?.salida != null && (
                <ReferenceDot x={today} y={todaySun.salida} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2} ifOverflow="extendDomain" />
              )}
              {today !== null && todaySun?.puesta != null && (
                <ReferenceDot x={today} y={todaySun.puesta} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2} ifOverflow="extendDomain" />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Hora oficial española (CET en invierno, CEST en verano; los cambios de hora se marcan con líneas grises).
        Salida y puesta calculadas con el centro del disco solar y 0,833° de refracción; el mediodía solar es el
        momento en que el sol culmina, corregido con la ecuación del tiempo, y salta una hora con cada cambio de
        horario. Por defecto: Valladolid (41,65°N, −4,72°E).
      </p>
    </div>
  );
}
