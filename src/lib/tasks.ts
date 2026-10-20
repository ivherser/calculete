import { z } from "zod";
import { MONTH_LABELS } from "./types";

export const TASK_SCOPES = ["dia", "semana", "mes", "anio"] as const;
export type TaskScope = (typeof TASK_SCOPES)[number];

export const TASK_SCOPE_TITLES: Record<TaskScope, string> = { dia: "Día", semana: "Semana", mes: "Mes", anio: "Año" };

/** Casillas que se pueden marcar a la derecha de cada concepto. */
export const TASK_SLOTS: Record<TaskScope, readonly string[]> = {
  dia: ["Mañana", "Tarde", "Noche"],
  semana: ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"],
  mes: Array.from({ length: 31 }, (_, i) => String(i + 1)),
  anio: MONTH_LABELS,
};

export const MAX_TASK_CONCEPT_LENGTH = 120;
export const MAX_TASKS = 500;

export interface Task {
  id: string;
  scope: TaskScope;
  concept: string;
  slots: number[];
}

const taskSchema = z
  .object({
    id: z.string().min(1).max(64),
    scope: z.enum(TASK_SCOPES),
    concept: z.string().max(MAX_TASK_CONCEPT_LENGTH),
    slots: z.array(z.number().int()).max(31),
  })
  .transform((t) => ({ ...t, slots: normalizeSlots(t.scope, t.slots) }));


function normalizeSlots(scope: TaskScope, slots: number[]): number[] {
  const max = TASK_SLOTS[scope].length;
  return [...new Set(slots)].filter((s) => s >= 0 && s < max).sort((a, b) => a - b);
}

/** Lee las tareas guardadas descartando las inválidas (p. ej. de secciones que ya no existen). */
export function parseTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, MAX_TASKS)
    .flatMap((item) => {
      const result = taskSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
}

export function newTask(scope: TaskScope): Task {
  return { id: crypto.randomUUID(), scope, concept: "", slots: [] };
}

export function toggleSlot(task: Task, slot: number): Task {
  const slots = task.slots.includes(slot) ? task.slots.filter((s) => s !== slot) : [...task.slots, slot];
  return { ...task, slots: normalizeSlots(task.scope, slots) };
}

/** Mueve `id` a la posición de `targetId` dentro de su misma sección. */
export function moveTask(tasks: Task[], id: string, targetId: string): Task[] {
  const from = tasks.findIndex((t) => t.id === id);
  const to = tasks.findIndex((t) => t.id === targetId);
  if (from < 0 || to < 0 || from === to || tasks[from].scope !== tasks[to].scope) return tasks;
  const next = [...tasks];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
