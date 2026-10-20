"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLocalTasks, saveLocalTasks } from "@/lib/storage";
import { MAX_TASKS, moveTask, newTask, TASK_SCOPES, type Task, type TaskScope } from "@/lib/tasks";
import { TasksTable } from "./TasksTable";

export function TaskApp() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura de localStorage tras hidratar
    setTasks(loadLocalTasks());
  }, []);

  useEffect(() => {
    if (tasks) saveLocalTasks(tasks);
  }, [tasks]);

  const add = useCallback((scope: TaskScope) => {
    const task = newTask(scope);
    setFocusId(task.id);
    setTasks((prev) => (prev && prev.length < MAX_TASKS ? [...prev, task] : prev));
  }, []);
  const change = useCallback(
    (task: Task) => setTasks((prev) => prev && prev.map((t) => (t.id === task.id ? task : t))),
    [],
  );
  const remove = useCallback((id: string) => setTasks((prev) => prev && prev.filter((t) => t.id !== id)), []);
  const move = useCallback((id: string, targetId: string) => setTasks((prev) => prev && moveTask(prev, id, targetId)), []);

  if (!tasks) return <p className="py-20 text-center text-slate-400">Cargando…</p>;

  return (
    <>
      {TASK_SCOPES.map((scope) => (
        <TasksTable
          key={scope}
          scope={scope}
          tasks={tasks.filter((t) => t.scope === scope)}
          focusId={focusId}
          onAdd={() => add(scope)}
          onChange={change}
          onRemove={remove}
          onMove={move}
        />
      ))}
      <p className="text-xs text-slate-400">
        Arrastra ⠿ para recolocar filas. Pulsa Intro en un concepto para añadir otro. Pulsa una casilla para marcarla
        o desmarcarla. Las tareas se guardan en este navegador.
      </p>
    </>
  );
}
