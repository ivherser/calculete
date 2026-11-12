"use client";

import { useCallback, useState } from "react";
import { useTasksData } from "@/hooks/useTasksData";
import { MAX_TASKS, moveTask, newTask, TASK_SCOPES, type Task, type TaskScope } from "@/lib/tasks";
import { Header } from "../Header";
import { LoginScreen } from "../LoginScreen";
import { MigrationDialog } from "../MigrationDialog";
import { TasksTable } from "./TasksTable";

export function TaskApp() {
  const data = useTasksData();
  const { tasks, setTasks } = data;
  const [focusId, setFocusId] = useState<string | null>(null);

  const add = useCallback(
    (scope: TaskScope) => {
      const task = newTask(scope);
      setFocusId(task.id);
      setTasks((prev) => (prev.length < MAX_TASKS ? [...prev, task] : prev));
    },
    [setTasks],
  );
  const change = useCallback(
    (task: Task) => setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t))),
    [setTasks],
  );
  const remove = useCallback((id: string) => setTasks((prev) => prev.filter((t) => t.id !== id)), [setTasks]);
  const move = useCallback(
    (id: string, targetId: string) => setTasks((prev) => moveTask(prev, id, targetId)),
    [setTasks],
  );

  if (!data.authReady) {
    return <p className="py-32 text-center text-slate-400">Cargando…</p>;
  }
  if (!data.user) return <LoginScreen authError={false} />;

  return (
    <>
      <Header user={data.user} syncStatus={data.syncStatus} current="/task" onLogout={() => void data.signOut()} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {data.loadError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {data.loadError}
          </p>
        )}

        {!data.ready ? (
          <p className="py-20 text-center text-slate-400">Cargando…</p>
        ) : (
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
              Arrastra ⠿ para recolocar filas. Pulsa Intro en un concepto para añadir otro. Pulsa una casilla para
              marcarla o desmarcarla. Las tareas se guardan en tu cuenta.
            </p>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">calculete</footer>

      {data.pendingMigration && (
        <MigrationDialog
          count={data.pendingMigration.length}
          onAccept={data.acceptMigration}
          onDecline={data.declineMigration}
        />
      )}
    </>
  );
}
