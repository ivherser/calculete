"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  clearLocalTasks,
  loadLocalTasks,
  markTaskMigrationAsked,
  wasTaskMigrationAsked,
} from "@/lib/storage";
import { rowsToTasks, taskToRow, type Task, type TaskRow } from "@/lib/tasks";
import type { SyncStatus } from "./useCalculeteData";

const SYNC_DEBOUNCE_MS = 700;
const TASK_COLUMNS = "id,user_id,scope,concept,slots,position";

function rowKey(row: TaskRow): string {
  return JSON.stringify([row.scope, row.concept, row.slots, row.position]);
}

/**
 * Estado de /task: requiere sesión. Las tareas viven en la tabla `tasks` de Supabase
 * (sincronización con debounce: upsert de filas cambiadas y borrado de las eliminadas).
 * Las tareas que quedaran en localStorage se ofrecen para importar una vez por usuario.
 */
export function useTasksData() {
  const supabase = getBrowserSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingMigration, setPendingMigration] = useState<Task[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const synced = useRef<Map<string, string>>(new Map());

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((prev) => {
        const next = session?.user ?? null;
        return prev?.id === next?.id ? prev : next;
      });
      setAuthReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;

    if (!userId || !supabase) {
      synced.current = new Map();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio al cerrar sesión
      setTasks([]);
      setPendingMigration(null);
      setLoadedFor(null);
      return;
    }

    setLoadedFor(undefined);
    setLoadError(null);
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError("No se han podido cargar tus tareas. Inténtalo de nuevo más tarde.");
          setTasks([]);
          return;
        }
        const rows = (data ?? []) as TaskRow[];
        const remote = rowsToTasks(rows);
        synced.current = new Map(
          remote.map((t, i) => {
            const row = taskToRow(t, userId, i);
            return [row.id, rowKey(row)];
          }),
        );
        setTasks(remote);
        setLoadedFor(userId);

        const local = loadLocalTasks();
        if (local.length > 0 && !wasTaskMigrationAsked(userId)) setPendingMigration(local);
      });

    return () => {
      active = false;
    };
  }, [authReady, userId, supabase]);

  // Persistencia
  useEffect(() => {
    if (!loadedFor || !supabase || loadedFor !== userId) return;

    const uid = loadedFor;
    const timer = setTimeout(async () => {
      const rows = tasks.map((t, i) => taskToRow(t, uid, i));
      const changed = rows.filter((r) => synced.current.get(r.id) !== rowKey(r));
      const currentIds = new Set(rows.map((r) => r.id));
      const removed = [...synced.current.keys()].filter((id) => !currentIds.has(id));
      if (changed.length === 0 && removed.length === 0) return;

      setSyncStatus("saving");
      try {
        if (changed.length > 0) {
          const { error } = await supabase.from("tasks").upsert(changed);
          if (error) throw error;
          for (const r of changed) synced.current.set(r.id, rowKey(r));
        }
        if (removed.length > 0) {
          const { error } = await supabase.from("tasks").delete().eq("user_id", uid).in("id", removed);
          if (error) throw error;
          for (const id of removed) synced.current.delete(id);
        }
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [tasks, loadedFor, userId, supabase]);

  const acceptMigration = useCallback(() => {
    if (!userId || !pendingMigration) return;
    const imported = pendingMigration.map((t) => ({ ...t, id: crypto.randomUUID() }));
    setTasks((prev) => [...prev, ...imported]);
    clearLocalTasks();
    markTaskMigrationAsked(userId);
    setPendingMigration(null);
  }, [userId, pendingMigration]);

  const declineMigration = useCallback(() => {
    if (userId) markTaskMigrationAsked(userId);
    setPendingMigration(null);
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  return {
    authReady,
    user,
    ready: loadedFor !== undefined || loadError !== null,
    tasks,
    setTasks,
    syncStatus,
    loadError,
    pendingMigration,
    acceptMigration,
    declineMigration,
    signOut,
  };
}
