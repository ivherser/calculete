"use client";

import { annualAmount } from "@/lib/balance";
import { MAX_AMOUNT, MAX_CONCEPT_LENGTH } from "@/lib/entries";
import { formatEuro } from "@/lib/format";
import { repattern, toggleMonth } from "@/lib/periodicity";
import { PERIODICITIES, PERIODICITY_LABELS, type Entry, type EntryKind, type Periodicity } from "@/lib/types";
import { MonthMatrix } from "./MonthMatrix";

interface EntriesTableProps {
  kind: EntryKind;
  title: string;
  entries: Entry[];
  onAdd: () => void;
  onChange: (entry: Entry) => void;
  onRemove: (id: string) => void;
}

function parseAmount(raw: string): number {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 100) / 100, MAX_AMOUNT);
}

export function EntriesTable({ kind, title, entries, onAdd, onChange, onRemove }: EntriesTableProps) {
  const total = entries.reduce((acc, e) => acc + annualAmount(e), 0);
  const accent = kind === "income" ? "text-emerald-700" : "text-rose-700";
  const placeholder = kind === "income" ? "p. ej. Nómina" : "p. ej. Alquiler";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby={`${kind}-title`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`${kind}-title`} className={`text-lg font-semibold ${accent}`}>
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Total anual: <strong className={accent}>{formatEuro(total)}</strong>
          </span>
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Añadir fila a ${title}`}
            title="Añadir fila"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold leading-none text-white hover:bg-indigo-700"
          >
            +
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="w-48 px-1 font-medium">Concepto</th>
              <th className="w-28 px-1 font-medium">Cantidad (€)</th>
              <th className="w-32 px-1 font-medium">Periodicidad</th>
              <th className="px-1 font-medium">Meses</th>
              <th className="w-24 px-1 text-right font-medium">Anual</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-1 py-4 text-center text-slate-400">
                  Sin filas. Pulsa «+» para añadir un concepto.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="align-middle">
                <td className="px-1">
                  <input
                    type="text"
                    value={entry.concept}
                    maxLength={MAX_CONCEPT_LENGTH}
                    placeholder={placeholder}
                    aria-label="Concepto"
                    onChange={(e) => onChange({ ...entry, concept: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </td>
                <td className="px-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={MAX_AMOUNT}
                    step="0.01"
                    value={entry.amount === 0 ? "" : entry.amount}
                    placeholder="0"
                    aria-label="Cantidad"
                    onChange={(e) => onChange({ ...entry, amount: parseAmount(e.target.value) })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-right tabular-nums outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </td>
                <td className="px-1">
                  <select
                    value={entry.periodicity}
                    aria-label="Periodicidad"
                    onChange={(e) => {
                      const periodicity = e.target.value as Periodicity;
                      onChange({ ...entry, periodicity, months: repattern(entry.months, periodicity) });
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    {PERIODICITIES.map((p) => (
                      <option key={p} value={p}>
                        {PERIODICITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-1">
                  <MonthMatrix
                    months={entry.months}
                    tone={kind}
                    conceptLabel={entry.concept || "concepto"}
                    onToggle={(m) => onChange({ ...entry, months: toggleMonth(entry, m) })}
                  />
                </td>
                <td className="px-1 text-right tabular-nums text-slate-700">{formatEuro(annualAmount(entry))}</td>
                <td className="px-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    aria-label="Eliminar fila"
                    title="Eliminar fila"
                    className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Pulsa un mes para autocompletar según la periodicidad desde ese mes. Pulsa un mes marcado para desmarcarlo.
      </p>
    </section>
  );
}
