"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { MAX_TASK_CONCEPT_LENGTH, TASK_SCOPE_TITLES, TASK_SLOTS, toggleSlot, type Task, type TaskScope } from "@/lib/tasks";

interface TasksTableProps {
  scope: TaskScope;
  tasks: Task[];
  focusId: string | null;
  onAdd: () => void;
  onChange: (task: Task) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
}

interface DragState {
  id: string;
  overId: string | null;
}

const PLACEHOLDERS: Record<TaskScope, string> = {
  dia: "p. ej. Regar",
  semana: "p. ej. Sacar la basura",
  mes: "p. ej. Pagar comunidad",
  anio: "p. ej. ITV",
};

const SLOT_HEADERS: Record<TaskScope, string> = { dia: "Momento del día", semana: "Días de la semana", mes: "Días del mes", anio: "Meses" };

function rowIdAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("tr[data-task-id]")?.dataset.taskId ?? null;
}

function SlotGrid({ task, onToggle }: { task: Task; onToggle: (slot: number) => void }) {
  const labels = TASK_SLOTS[task.scope];
  const active = new Set(task.slots);
  const layout =
    task.scope === "dia"
      ? "grid grid-cols-3 gap-1"
      : task.scope === "semana"
        ? "grid grid-cols-7 gap-1"
        : task.scope === "mes"
          ? "grid grid-cols-16 gap-1"
          : "grid grid-cols-12 gap-1";
  return (
    <div className={layout} role="group" aria-label={`${SLOT_HEADERS[task.scope]} de ${task.concept || "concepto"}`}>
      {labels.map((label, i) => {
        const isOn = active.has(i);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isOn}
            aria-label={`${label}${isOn ? " (marcado)" : ""}`}
            onClick={() => onToggle(i)}
            className={`h-8 rounded-md border font-semibold transition ${task.scope === "anio" || task.scope === "mes" ? "min-w-8 text-[10px]" : "min-w-12 text-xs"} ${
              isOn
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function TasksTable({ scope, tasks, focusId, onAdd, onChange, onRemove, onMove }: TasksTableProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const title = TASK_SCOPE_TITLES[scope];
  const dragIndex = drag ? tasks.findIndex((t) => t.id === drag.id) : -1;
  const overIndex = drag?.overId ? tasks.findIndex((t) => t.id === drag.overId) : -1;

  const startDrag = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, overId: id });
  };
  const moveDrag = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const overId = rowIdAt(e.clientX, e.clientY);
    if (overId && overId !== drag.overId && tasks.some((x) => x.id === overId)) setDrag({ ...drag, overId });
  };
  const endDrag = () => {
    if (drag?.overId && drag.overId !== drag.id) onMove(drag.id, drag.overId);
    setDrag(null);
  };
  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = e.key === "ArrowUp" ? tasks[index - 1] : e.key === "ArrowDown" ? tasks[index + 1] : undefined;
    if (!target) return;
    e.preventDefault();
    onMove(tasks[index].id, target.id);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby={`task-${scope}-title`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`task-${scope}-title`} className="text-lg font-semibold text-indigo-700">
          {title}
        </h2>
        <span className="text-sm text-slate-500">
          {tasks.length} {tasks.length === 1 ? "concepto" : "conceptos"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full border-separate border-spacing-y-1 text-sm ${scope === "anio" || scope === "mes" ? "min-w-[860px]" : "min-w-[600px]"}`}>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="w-6" />
              <th className="w-56 px-1 font-medium">Concepto</th>
              <th className="px-1 font-medium">{SLOT_HEADERS[scope]}</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-1 py-4 text-center text-slate-400">
                  Sin filas. Pulsa «+» para añadir un concepto.
                </td>
              </tr>
            )}
            {tasks.map((task, index) => (
              <tr
                key={task.id}
                data-task-id={task.id}
                className={`align-middle transition-opacity ${drag?.id === task.id ? "opacity-50" : ""} ${
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
                    aria-label={`Mover ${task.concept || "fila"} (flechas arriba/abajo)`}
                    title="Arrastra para recolocar"
                    onPointerDown={(e) => startDrag(e, task.id)}
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
                    autoFocus={task.id === focusId}
                    enterKeyHint="next"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        onAdd();
                      }
                    }}
                    value={task.concept}
                    maxLength={MAX_TASK_CONCEPT_LENGTH}
                    placeholder={PLACEHOLDERS[scope]}
                    aria-label="Concepto"
                    onChange={(e) => onChange({ ...task, concept: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </td>
                <td className="px-1">
                  <SlotGrid task={task} onToggle={(slot) => onChange(toggleSlot(task, slot))} />
                </td>
                <td className="px-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(task.id)}
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
    </section>
  );
}
