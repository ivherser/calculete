"use client";

import { useMemo, useState } from "react";
import {
  ANGLE_KEYS,
  SIDE_KEYS,
  solveRightTriangle,
  solveTriangle,
  triangleArea,
  type Triangle,
  type TriangleInput,
  type TriangleKey,
} from "@/lib/triangle";

type RawValues = Record<TriangleKey, string>;

const EMPTY: RawValues = { a: "", b: "", c: "", A: "", B: "", C: "" };

const formatNumber = (v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 4 });

function parseValues(raw: RawValues, keys: readonly TriangleKey[]): { input: TriangleInput; error?: string } {
  const input: TriangleInput = {};
  for (const k of keys) {
    const text = raw[k].trim();
    if (!text) continue;
    const n = Number(text.replace(",", "."));
    if (!Number.isFinite(n)) return { input, error: `El valor de ${k} no es un número válido.` };
    input[k] = n;
  }
  return { input };
}

function TriangleSvg({ triangle, rightAngle }: { triangle: Triangle | null; rightAngle: boolean }) {
  const W = 360;
  const H = 260;
  const PAD = 48;
  const t = triangle ?? { a: 4, b: 3, c: 5, A: 53.13, B: 36.87, C: 90 };
  const rad = (t.A * Math.PI) / 180;
  const raw = { A: [0, 0], B: [t.c, 0], C: [t.b * Math.cos(rad), t.b * Math.sin(rad)] } as const;
  const xs = [raw.A[0], raw.B[0], raw.C[0]];
  const ys = [raw.A[1], raw.B[1], raw.C[1]];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const scale = Math.min((W - 2 * PAD) / (maxX - minX || 1), (H - 2 * PAD) / (maxY || 1));
  const offsetX = (W - (maxX - minX) * scale) / 2;
  const offsetY = (H - maxY * scale) / 2;
  const P = (x: number, y: number) => [offsetX + (x - minX) * scale, H - offsetY - y * scale] as const;
  const A = P(...raw.A);
  const B = P(...raw.B);
  const C = P(...raw.C);
  const cx = (A[0] + B[0] + C[0]) / 3;
  const cy = (A[1] + B[1] + C[1]) / 3;
  const away = (p: readonly [number, number], d: number) => {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (dx / len) * d, p[1] + (dy / len) * d] as const;
  };
  const mid = (p: readonly [number, number], q: readonly [number, number]) => away([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], 16);
  const vertices = [
    { label: "A", p: A, angle: t.A },
    { label: "B", p: B, angle: t.B },
    { label: "C", p: C, angle: t.C },
  ];
  const sides = [
    { label: "a", p: mid(B, C), value: t.a },
    { label: "b", p: mid(A, C), value: t.b },
    { label: "c", p: mid(A, B), value: t.c },
  ];

  let rightMark: string | null = null;
  if (triangle && rightAngle) {
    const s = 14;
    const u = (q: readonly [number, number]) => {
      const len = Math.hypot(q[0] - C[0], q[1] - C[1]) || 1;
      return [(q[0] - C[0]) / len, (q[1] - C[1]) / len];
    };
    const [ux, uy] = u(A);
    const [vx, vy] = u(B);
    rightMark = `M${C[0] + ux * s},${C[1] + uy * s} L${C[0] + (ux + vx) * s},${C[1] + (uy + vy) * s} L${C[0] + vx * s},${C[1] + vy * s}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Dibujo del triángulo">
      <polygon
        points={`${A.join(",")} ${B.join(",")} ${C.join(",")}`}
        fill={triangle ? "#e0e7ff" : "#f1f5f9"}
        stroke={triangle ? "#4f46e5" : "#94a3b8"}
        strokeWidth={2}
        strokeDasharray={triangle ? undefined : "6 4"}
        strokeLinejoin="round"
      />
      {rightMark && <path d={rightMark} fill="none" stroke="#4f46e5" strokeWidth={1.5} />}
      {vertices.map((v) => {
        const [x, y] = away(v.p, 18);
        return (
          <text key={v.label} x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0f172a">
            {v.label}
            {triangle && <tspan fontSize={11} fontWeight={400} fill="#475569"> {formatNumber(Math.round(v.angle * 10) / 10)}°</tspan>}
          </text>
        );
      })}
      {sides.map((s) => (
        <text key={s.label} x={s.p[0]} y={s.p[1] + 4} textAnchor="middle" fontSize={13} fontStyle="italic" fill="#4338ca">
          {s.label}
          {triangle && <tspan fontStyle="normal" fontSize={11} fill="#475569"> {formatNumber(Math.round(s.value * 100) / 100)}</tspan>}
        </text>
      ))}
    </svg>
  );
}

export function TriangleCalculator() {
  const [rightMode, setRightMode] = useState(true);
  const [raw, setRaw] = useState<RawValues>(EMPTY);
  const [solutionIndex, setSolutionIndex] = useState(0);

  const editableKeys = useMemo<readonly TriangleKey[]>(
    () => (rightMode ? ["a", "b", "c", "A", "B"] : [...SIDE_KEYS, ...ANGLE_KEYS]),
    [rightMode],
  );
  const required = rightMode ? 2 : 3;

  const { result, filled } = useMemo(() => {
    const { input, error } = parseValues(raw, editableKeys);
    const filled = Object.keys(input).length;
    if (error) return { result: { ok: false as const, error }, filled };
    return { result: rightMode ? solveRightTriangle(input) : solveTriangle(input), filled };
  }, [raw, editableKeys, rightMode]);

  const solutions = result.ok ? result.solutions : [];
  const solution = solutions[Math.min(solutionIndex, solutions.length - 1)] ?? null;
  const showError = !result.ok && filled >= required;

  const setValue = (k: TriangleKey, v: string) => {
    setRaw((prev) => ({ ...prev, [k]: v }));
    setSolutionIndex(0);
  };

  const field = (k: TriangleKey, unit: string) => {
    const locked = rightMode && k === "C";
    const computed = solution && !raw[k].trim() ? formatNumber(solution[k]) : "";
    return (
      <label key={k} className="text-sm text-slate-600">
        <span className={SIDE_KEYS.includes(k as never) ? "italic" : ""}>{k}</span>
        <span className="text-slate-400"> ({unit})</span>
        <input
          type="text"
          inputMode="decimal"
          value={locked ? "90" : raw[k]}
          disabled={locked}
          placeholder={computed}
          onChange={(e) => setValue(k, e.target.value)}
          className={`mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 placeholder:font-medium placeholder:text-emerald-700 disabled:bg-slate-100 disabled:text-slate-500 ${
            computed ? "bg-emerald-50" : ""
          }`}
        />
      </label>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
            <button
              type="button"
              role="switch"
              aria-checked={!rightMode}
              onClick={() => {
                setRightMode((m) => !m);
                setSolutionIndex(0);
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${rightMode ? "bg-slate-300" : "bg-indigo-600"}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${rightMode ? "" : "translate-x-5"}`}
              />
            </button>
            {rightMode ? "Triángulo rectángulo (C = 90°)" : "Triángulo cualquiera"}
          </label>
          <button
            type="button"
            onClick={() => {
              setRaw(EMPTY);
              setSolutionIndex(0);
            }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Limpiar
          </button>
        </div>

        <p className="text-sm text-slate-500">
          {rightMode
            ? "Introduce 2 valores (al menos un lado). c es la hipotenusa."
            : "Introduce 3 valores (al menos un lado). Se resuelven los casos LLL, LAL, ALA, AAL y LLA."}{" "}
          Los lados a, b y c son opuestos a los ángulos A, B y C.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {SIDE_KEYS.map((k) => field(k, "lado"))}
          {ANGLE_KEYS.map((k) => field(k, "°"))}
        </div>

        {showError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {result.ok ? "" : result.error}
          </p>
        )}
        {!showError && !solution && (
          <p className="text-sm text-slate-400">
            {filled}/{required} valores introducidos.
          </p>
        )}

        {solutions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-amber-700">Caso ambiguo: hay 2 triángulos posibles.</span>
            {solutions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSolutionIndex(i)}
                className={`rounded-lg px-3 py-1 font-medium ${
                  i === Math.min(solutionIndex, solutions.length - 1) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Solución {i + 1}
              </button>
            ))}
          </div>
        )}

        {solution && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
            <dt className="text-slate-500">Perímetro</dt>
            <dd className="font-semibold tabular-nums">{formatNumber(solution.a + solution.b + solution.c)}</dd>
            <dt className="text-slate-500">Área</dt>
            <dd className="font-semibold tabular-nums">{formatNumber(triangleArea(solution))}</dd>
          </dl>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <TriangleSvg triangle={solution} rightAngle={rightMode} />
      </div>
    </div>
  );
}
