"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
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
  focusId: string | null;
  onAdd: () => void;
  onChange: (entry: Entry) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
}

interface DragState {
  id: string;
  overId: string | null;
}

function rowIdAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("tr[data-entry-id]")?.dataset.entryId ?? null;
}

function parseAmount(raw: string): number {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 100) / 100, MAX_AMOUNT);
}

export function EntriesTable({
  kind,
  title,
  entries,
  focusId,
  onAdd,
  onChange,
  onRemove,
  onMove,
}: EntriesTableProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const total = entries.reduce((acc, e) => acc + annualAmount(e), 0);
  const accent = kind === "income" ? "text-emerald-700" : "text-rose-700";
  const placeholder = kind === "income" ? "p. ej. Nómina" : "p. ej. Alquiler";
  const dragIndex = drag ? entries.findIndex((e) => e.id === drag.id) : -1;
  const overIndex = drag?.overId ? entries.findIndex((e) => e.id === drag.overId) : -1;

  const startDrag = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, overId: id });
  };
  const moveDrag = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const overId = rowIdAt(e.clientX, e.clientY);
    if (overId && overId !== drag.overId && entries.some((x) => x.id === overId)) setDrag({ ...drag, overId });
  };
  const endDrag = () => {
    if (drag?.overId && drag.overId !== drag.id) onMove(drag.id, drag.overId);
    setDrag(null);
  };
  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = e.key === "ArrowUp" ? entries[index - 1] : e.key === "ArrowDown" ? entries[index + 1] : undefined;
    if (!target) return;
    e.preventDefault();
    onMove(entries[index].id, target.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby={`${kind}-title`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`${kind}-title`} className={`text-lg font-semibold ${accent}`}>
          {title}
        </h2>
        <span className="text-sm text-slate-500">
          Total anual: <strong className={accent}>{formatEuro(total)}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="w-6" />
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
                <td colSpan={7} className="px-1 py-4 text-center text-slate-400">
                  Sin filas. Pulsa «+» para añadir un concepto.
                </td>
              </tr>
            )}
            {entries.map((entry, index) => (
              <tr
                key={entry.id}
                data-entry-id={entry.id}
                className={`align-middle transition-opacity ${drag?.id === entry.id ? "opacity-50" : ""} ${
                  index === overIndex && overIndex !== dragIndex
                    ? overIndex < dragIndex
                      ? "[&>td]:border-t-2 [&>td]:border-indigo-500"
                      : "[&>td]:border-b-2 [&>td]:border-indigo-500"
                    : ""
                }`}
              >
                <td className="px-0.5">
                  <button
                    type="button"
                    aria-label={`Mover ${entry.concept || "fila"} (flechas arriba/abajo)`}
                    title="Arrastra para recolocar"
                    onPointerDown={(e) => startDrag(e, entry.id)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={() => setDrag(null)}
                    onKeyDown={(e) => handleKey(e, index)}
                    className={`touch-none select-none rounded px-1 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${
                      drag ? "cursor-grabbing" : "cursor-grab"
                    }`}
                  >
                    ⠿
                  </button>
                </td>
                <td className="px-1">
                  <input
                    type="text"
                    autoFocus={entry.id === focusId}
                    enterKeyHint="next"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        onAdd();
                      }
                    }}
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
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Añadir fila a ${title}`}
        title="Añadir fila"
        className="mt-1 ml-7 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold leading-none text-white hover:bg-indigo-700"
      >
        +
      </button>
      <p className="mt-2 text-xs text-slate-400">
        Arrastra ⠿ para recolocar filas. Pulsa Intro en un concepto para añadir otro. Pulsa un mes para autocompletar según la periodicidad desde ese mes. Pulsa un mes marcado para desmarcarlo.
      </p>
    </section>
  );
}
