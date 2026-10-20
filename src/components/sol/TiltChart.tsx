"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  annualOptimalTilt,
  dailyOptimalTilt,
  dayOfYear,
  DAYS_IN_YEAR,
  DEFAULT_LATITUDE,
  MONTH_START_DAYS,
  SEASON_LABELS,
  SEASONS,
  seasonalOptimalTilts,
  seasonOfDay,
} from "@/lib/solar";
import { MONTH_LABELS } from "@/lib/types";

const SEASON_COLORS = { invierno: "#0ea5e9", primavera: "#22c55e", verano: "#f59e0b", otono: "#a16207" } as const;

const noopSubscribe = () => () => {};
const getToday = () => dayOfYear(new Date());
const getServerToday = () => null;

const formatDeg = (v: number) => `${v.toLocaleString("es-ES", { maximumFractionDigits: 1 })}°`;

function dayLabel(n: number): string {
  let month = 0;
  while (month < 11 && MONTH_START_DAYS[month + 1] <= n) month++;
  return `${n - MONTH_START_DAYS[month] + 1} ${MONTH_LABELS[month]}`;
}

export function TiltChart() {
  const today = useSyncExternalStore(noopSubscribe, getToday, getServerToday);
  const [latitudeRaw, setLatitudeRaw] = useState(String(DEFAULT_LATITUDE).replace(".", ","));
  const parsed = Number(latitudeRaw.replace(",", "."));
  const latitudeValid = latitudeRaw.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= 66;
  const latitude = latitudeValid ? parsed : DEFAULT_LATITUDE;

  const { data, annual, seasonal } = useMemo(() => {
    const seasonal = seasonalOptimalTilts(latitude);
    const annual = annualOptimalTilt(latitude);
    const data = Array.from({ length: DAYS_IN_YEAR }, (_, i) => {
      const day = i + 1;
      const season = seasonOfDay(day);
      const point: Record<string, number | null> = { day, diario: dailyOptimalTilt(latitude, day), anual: annual };
      for (const s of SEASONS) point[s] = s === season ? seasonal[s] : null;
      return point;
    });
    return { data, annual, seasonal };
  }, [latitude]);

  const todayTilt = today === null ? null : dailyOptimalTilt(latitude, today);

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
        {!latitudeValid && <p className="text-sm text-rose-700">Introduce una latitud entre 0 y 66°.</p>}
        {today !== null && todayTilt !== null && (
          <p className="text-sm text-slate-700">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-600 align-middle" />
            Hoy ({dayLabel(today)}, día {today}): inclinación óptima <strong>{formatDeg(todayTilt)}</strong>
          </p>
        )}
      </div>

      <div className="h-80 w-full">
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
            <YAxis domain={[0, 90]} ticks={[0, 15, 30, 45, 60, 75, 90]} tickFormatter={(v: number) => `${v}°`} tick={{ fontSize: 12 }} width={44} />
            <Tooltip
              labelFormatter={(d) => `${dayLabel(Number(d))} (día ${d})`}
              formatter={(v) => formatDeg(Number(v))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="diario" name="Óptimo diario" stroke="#4f46e5" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="anual" name={`Fijo anual (${formatDeg(annual)})`} stroke="#64748b" strokeDasharray="6 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {SEASONS.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                name={`${SEASON_LABELS[s]} (${formatDeg(seasonal[s])})`}
                stroke={SEASON_COLORS[s]}
                strokeWidth={3}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
            {today !== null && todayTilt !== null && (
              <ReferenceDot x={today} y={todayTilt} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} ifOverflow="extendDomain" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        Paneles orientados al sur (hemisferio norte). Óptimo diario: panel perpendicular al sol al mediodía solar
        (latitud − declinación). Estacional: media del óptimo diario en cada estación astronómica. Fijo anual:
        aproximación del IDAE (3,7 + 0,69 · latitud).
      </p>
    </div>
  );
}
