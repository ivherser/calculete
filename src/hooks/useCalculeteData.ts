"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { entryToRow, rowsToEntries, type EntryRow } from "@/lib/entries";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  clearLocalEntries,
  loadLocalEntries,
  markMigrationAsked,
  saveLocalEntries,
  wasMigrationAsked,
} from "@/lib/storage";
import type { Entry } from "@/lib/types";

export type SyncStatus = "idle" | "saving" | "saved" | "error";

const SYNC_DEBOUNCE_MS = 700;
const ENTRY_COLUMNS = "id,user_id,kind,concept,amount,periodicity,months,position";

function rowKey(row: EntryRow): string {
  return JSON.stringify([row.kind, row.concept, Number(row.amount), row.periodicity, row.months, row.position]);
}

/**
 * Estado de la app. Sin sesión → localStorage. Con sesión → tabla `entries` de Supabase
 * (sincronización con debounce: upsert de filas cambiadas y borrado de las eliminadas).
 */
export function useCalculeteData() {
  const supabase = getBrowserSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingMigration, setPendingMigration] = useState<Entry[] | null>(null);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde localStorage
      setEntries(loadLocalEntries());
      setPendingMigration(null);
      setLoadedFor(null);
      return;
    }

    setLoadedFor(undefined);
    setLoadError(null);
    supabase
      .from("entries")
      .select(ENTRY_COLUMNS)
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError("No se han podido cargar tus datos. Inténtalo de nuevo más tarde.");
          setEntries([]);
          return;
        }
        const rows = (data ?? []) as EntryRow[];
        const remote = rowsToEntries(rows);
        synced.current = new Map(
          remote.map((e, i) => {
            const row = entryToRow(e, userId, i);
            return [row.id, rowKey(row)];
          }),
        );
        setEntries(remote);
        setLoadedFor(userId);

        const local = loadLocalEntries();
        if (local.length > 0 && !wasMigrationAsked(userId)) setPendingMigration(local);
      });

    return () => {
      active = false;
    };
  }, [authReady, userId, supabase]);

  // Persistencia
  useEffect(() => {
    if (loadedFor === undefined) return;
    if (loadedFor === null) {
      saveLocalEntries(entries);
      return;
    }
    if (!supabase || loadedFor !== userId) return;

    const uid = loadedFor;
    const timer = setTimeout(async () => {
      const rows = entries.map((e, i) => entryToRow(e, uid, i));
      const changed = rows.filter((r) => synced.current.get(r.id) !== rowKey(r));
      const currentIds = new Set(rows.map((r) => r.id));
      const removed = [...synced.current.keys()].filter((id) => !currentIds.has(id));
      if (changed.length === 0 && removed.length === 0) return;

      setSyncStatus("saving");
      try {
        if (changed.length > 0) {
          const { error } = await supabase.from("entries").upsert(changed);
          if (error) throw error;
          for (const r of changed) synced.current.set(r.id, rowKey(r));
        }
        if (removed.length > 0) {
          const { error } = await supabase.from("entries").delete().eq("user_id", uid).in("id", removed);
          if (error) throw error;
          for (const id of removed) synced.current.delete(id);
        }
        setSyncStatus("saved");
      } catch {
        setSyncStatus("error");
      }
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [entries, loadedFor, userId, supabase]);

  const acceptMigration = useCallback(() => {
    if (!userId || !pendingMigration) return;
    const imported = pendingMigration.map((e) => ({ ...e, id: crypto.randomUUID() }));
    setEntries((prev) => [...prev, ...imported]);
    clearLocalEntries();
    markMigrationAsked(userId);
    setPendingMigration(null);
  }, [userId, pendingMigration]);

  const declineMigration = useCallback(() => {
    if (userId) markMigrationAsked(userId);
    setPendingMigration(null);
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  return {
    supabaseEnabled: Boolean(supabase),
    user,
    ready: loadedFor !== undefined || loadError !== null,
    entries,
    setEntries,
    syncStatus,
    loadError,
    pendingMigration,
    acceptMigration,
    declineMigration,
    signOut,
  };
}
