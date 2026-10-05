"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  annualAmount,
  expensesByConcept,
  monthlyBalance,
  normalizePercentages,
  rebalancePercentages,
  safetyCushion,
  SAFETY_CUSHION_MONTHS,
} from "@/lib/balance";
import { formatEuro, formatPercent } from "@/lib/format";
import { MONTH_LABELS, type Entry } from "@/lib/types";

const DONUT_COLORS = ["#e11d48", "#f97316", "#eab308", "#8b5cf6", "#0ea5e9", "#14b8a6", "#94a3b8"];
const DISTRIBUTION = [
  { key: "ahorro", label: "Ahorro", color: "#10b981" },
  { key: "inversion", label: "Inversión", color: "#6366f1" },
  { key: "gastos", label: "Gastos", color: "#f59e0b" },
] as const;

interface BalanceSectionProps {
  entries: Entry[];
  distribution: number[];
  onDistributionChange: (values: number[]) => void;
}

const euroTick = (v: number) => formatEuro(v);
const tooltipEuro = (v: unknown) => formatEuro(Number(v));

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export function BalanceSection({ entries, distribution, onDistributionChange }: BalanceSectionProps) {
  const monthly = useMemo(
    () =>
      monthlyBalance(entries).map((m) => ({
        ...m,
        label: MONTH_LABELS[m.month],
        positive: Math.max(m.net, 0),
        negative: Math.min(m.net, 0),
      })),
    [entries],
  );
  const byConcept = useMemo(
    () => expensesByConcept(entries).map((c, i) => ({ ...c, fill: DONUT_COLORS[i % DONUT_COLORS.length] })),
    [entries],
  );
  const { monthlyAverage, cushion } = useMemo(() => safetyCushion(entries), [entries]);

  const annualIncome = entries.filter((e) => e.kind === "income").reduce((a, e) => a + annualAmount(e), 0);
  const annualExpense = entries.filter((e) => e.kind === "expense").reduce((a, e) => a + annualAmount(e), 0);
  const profit = annualIncome - annualExpense;

  const percentages = normalizePercentages(distribution);
  const distributionData = DISTRIBUTION.map((d, i) => ({
    name: d.label,
    value: Math.max(profit, 0) * (percentages[i] / 100),
    fill: d.color,
  }));

  return (
    <section aria-labelledby="balance-title" className="space-y-4">
      <h2 id="balance-title" className="text-lg font-semibold text-indigo-700">
        Balance
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Ingresos anuales">
          <p className="text-2xl font-bold tabular-nums text-emerald-600">{formatEuro(annualIncome)}</p>
        </Card>
        <Card title="Gastos anuales">
          <p className="text-2xl font-bold tabular-nums text-rose-600">{formatEuro(annualExpense)}</p>
        </Card>
        <Card title="Beneficio anual">
          <p className={`text-2xl font-bold tabular-nums ${profit >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
            {formatEuro(profit)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Evolución mensual (ingresos − gastos)" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={euroTick} tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={tooltipEuro} />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="positive" name="Balance positivo" stackId="net" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" name="Balance negativo" stackId="net" fill="#f43f5e" radius={[0, 0, 4, 4]} />
                <Line type="monotone" dataKey="cumulative" name="Acumulado" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Principales gastos anuales">
          {byConcept.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Añade gastos para ver su reparto.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byConcept} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} />
                  <Tooltip formatter={tooltipEuro} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Colchón de seguridad">
          <p className="text-4xl font-extrabold tabular-nums text-indigo-700">{formatEuro(cushion)}</p>
          <p className="mt-2 text-sm text-slate-500">
            Gasto medio mensual ({formatEuro(monthlyAverage)}) × {SAFETY_CUSHION_MONTHS} meses.
          </p>
        </Card>

        <Card title="Distribución del beneficio anual" className="lg:col-span-2">
          {profit <= 0 && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Tu beneficio anual no es positivo: no hay excedente que repartir.
            </p>
          )}
          <div className="grid items-center gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {DISTRIBUTION.map((d, i) => (
                <div key={d.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <label htmlFor={`dist-${d.key}`} className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.label}
                    </label>
                    <span className="tabular-nums text-slate-600">
                      {formatPercent(percentages[i])} · <strong>{formatEuro(distributionData[i].value)}</strong>
                    </span>
                  </div>
                  <input
                    id={`dist-${d.key}`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round(percentages[i])}
                    onChange={(e) => onDistributionChange(rebalancePercentages(percentages, i, Number(e.target.value)))}
                    className="w-full"
                    style={{ accentColor: d.color }}
                  />
                </div>
              ))}
            </div>
            <div className="h-56">
              {profit > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} />
                    <Tooltip formatter={tooltipEuro} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Sin excedente</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
