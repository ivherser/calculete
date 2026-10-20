"use client";

import { useState } from "react";
import {
  ANGLE_KEYS,
  applyEdit,
  DEFAULT_TRIANGLE,
  KEY_LABELS,
  SIDE_KEYS,
  switchMode,
  triangleArea,
  type Triangle,
  type TriangleKey,
} from "@/lib/triangle";

const formatNumber = (v: number) => v.toLocaleString("es-ES", { maximumFractionDigits: 4 });

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
    { label: "A", p: A, angle: t.A, name: "α" },
    { label: "B", p: B, angle: t.B, name: "β" },
    { label: "C", p: C, angle: t.C, name: "γ" },
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
            {triangle && (
              <tspan fontSize={11} fontWeight={400} fill="#475569">
                {" "}
                {v.name} {formatNumber(Math.round(v.angle * 10) / 10)}°
              </tspan>
            )}
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

interface Editing {
  key: TriangleKey;
  text: string;
  error: string | null;
}

export function TriangleCalculator() {
  const [rightMode, setRightMode] = useState(true);
  const [triangle, setTriangle] = useState<Triangle>(DEFAULT_TRIANGLE);
  const [history, setHistory] = useState<TriangleKey[]>(["a", "b"]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [adjusted, setAdjusted] = useState<TriangleKey | null>(null);

  const used = new Set(history);

  const edit = (key: TriangleKey, text: string) => {
    const value = Number(text.trim().replace(",", "."));
    if (!text.trim() || !Number.isFinite(value) || value <= 0) {
      setEditing({ key, text, error: `Introduce en ${KEY_LABELS[key]} un número mayor que 0.` });
      return;
    }
    const result = applyEdit(triangle, history, key, value, rightMode);
    if (!result.ok) {
      setEditing({ key, text, error: result.error });
      return;
    }
    setEditing({ key, text, error: null });
    setTriangle(result.triangle);
    setHistory(result.history);
    setAdjusted(result.adjusted);
  };

  const changeMode = (right: boolean) => {
    const next = switchMode(triangle, history, right);
    setRightMode(right);
    setTriangle(next.triangle);
    setHistory(next.history);
    setEditing(null);
    setAdjusted(null);
  };

  const reset = () => {
    const next = switchMode(DEFAULT_TRIANGLE, ["a", "b", "c"], rightMode);
    setTriangle(next.triangle);
    setHistory(rightMode ? ["a", "b"] : ["a", "b", "c"]);
    setEditing(null);
    setAdjusted(null);
  };

  const field = (k: TriangleKey) => {
    const locked = rightMode && k === "C";
    const isEditing = editing?.key === k;
    const hasError = isEditing && editing.error !== null;
    const isUsed = used.has(k) && !locked;
    const value = isEditing ? editing.text : formatNumber(Math.round(triangle[k] * 10_000) / 10_000);
    return (
      <label key={k} className="text-sm text-slate-600">
        <span className={SIDE_KEYS.includes(k as never) ? "italic" : ""}>{KEY_LABELS[k]}</span>
        <span className="text-slate-400"> ({SIDE_KEYS.includes(k as never) ? "lado" : "°"})</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          disabled={locked}
          aria-invalid={hasError}
          onChange={(e) => edit(k, e.target.value)}
          onBlur={() => setEditing(null)}
          className={`mt-1 block w-full rounded-lg border px-3 py-1.5 tabular-nums text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500 ${
            hasError
              ? "border-rose-400 bg-rose-50"
              : isUsed
                ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-800"
                : "border-slate-300 bg-white"
          }`}
        />
      </label>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className={rightMode ? "text-indigo-700" : "text-slate-400"}>Rectángulo</span>
            <button
              type="button"
              role="switch"
              aria-checked={!rightMode}
              aria-label="No rectángulo"
              onClick={() => changeMode(!rightMode)}
              className={`relative h-6 w-11 rounded-full transition-colors ${rightMode ? "bg-slate-300" : "bg-indigo-600"}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${rightMode ? "" : "translate-x-5"}`}
              />
            </button>
            <span className={rightMode ? "text-slate-400" : "text-indigo-700"}>No rectángulo</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Reiniciar
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Edita cualquier valor: se calculan los demás a partir de los {rightMode ? "2" : "3"} últimos introducidos
          (<span className="font-medium text-emerald-700">en verde</span>). Si el último no es compatible, se ajusta el
          penúltimo. Los lados a, b y c son opuestos a los ángulos α, β y γ{rightMode ? "; γ = 90° y c es la hipotenusa" : ""}.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {SIDE_KEYS.map((k) => field(k))}
          {ANGLE_KEYS.map((k) => field(k))}
        </div>

        {editing?.error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {editing.error}
          </p>
        )}
        {!editing?.error && adjusted && (
          <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Se ha ajustado {KEY_LABELS[adjusted]} a {formatNumber(Math.round(triangle[adjusted] * 10_000) / 10_000)} para
            que el triángulo sea posible.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-4">
          <dt className="text-slate-500">Perímetro</dt>
          <dd className="font-semibold tabular-nums">{formatNumber(triangle.a + triangle.b + triangle.c)}</dd>
          <dt className="text-slate-500">Área</dt>
          <dd className="font-semibold tabular-nums">{formatNumber(triangleArea(triangle))}</dd>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <TriangleSvg triangle={triangle} rightAngle={rightMode} />
      </div>
    </div>
  );
}
