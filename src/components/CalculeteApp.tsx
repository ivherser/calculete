"use client";

import { useCallback, useEffect, useState } from "react";
import { useCalculeteData } from "@/hooks/useCalculeteData";
import { arrayMove } from "@/lib/balance";
import { MAX_ENTRIES, newEntry } from "@/lib/entries";
import { loadDistribution, saveDistribution } from "@/lib/storage";
import type { Entry, EntryKind } from "@/lib/types";
import { BalanceSection } from "./BalanceSection";
import { EntriesTable } from "./EntriesTable";
import { Header } from "./Header";
import { LoginScreen } from "./LoginScreen";
import { MigrationDialog } from "./MigrationDialog";

export function CalculeteApp() {
  const data = useCalculeteData();
  const { entries, setEntries } = data;
  const [distribution, setDistribution] = useState<number[] | null>(null);
  const [authError, setAuthError] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura de localStorage tras hidratar
    setDistribution(loadDistribution());
    const params = new URLSearchParams(window.location.search);
    if (params.has("auth_error")) {
      setAuthError(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const updateDistribution = useCallback((values: number[]) => {
    setDistribution(values);
    saveDistribution(values);
  }, []);

  const add = useCallback(
    (kind: EntryKind) => {
      const entry = newEntry(kind);
      setFocusId(entry.id);
      setEntries((prev) => (prev.length >= MAX_ENTRIES ? prev : [...prev, entry]));
    },
    [setEntries],
  );
  const move = useCallback(
    (id: string, targetId: string) =>
      setEntries((prev) =>
        arrayMove(
          prev,
          prev.findIndex((e) => e.id === id),
          prev.findIndex((e) => e.id === targetId),
        ),
      ),
    [setEntries],
  );
  const change = useCallback(
    (entry: Entry) => setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e))),
    [setEntries],
  );
  const remove = useCallback((id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)), [setEntries]);

  const incomes = entries.filter((e) => e.kind === "income");
  const expenses = entries.filter((e) => e.kind === "expense");

  if (!data.authReady) {
    return <p className="py-32 text-center text-slate-400">Cargando…</p>;
  }
  if (!data.user) return <LoginScreen authError={authError} />;

  return (
    <>
      <Header user={data.user} syncStatus={data.syncStatus} onLogout={() => void data.signOut()} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {data.loadError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {data.loadError}
          </p>
        )}

        {!data.ready || distribution === null ? (
          <p className="py-20 text-center text-slate-400">Cargando…</p>
        ) : (
          <>
            <EntriesTable
              kind="income"
              title="Ingresos"
              entries={incomes}
              focusId={focusId}
              onAdd={() => add("income")}
              onChange={change}
              onRemove={remove}
              onMove={move}
            />
            <EntriesTable
              kind="expense"
              title="Gastos"
              entries={expenses}
              focusId={focusId}
              onAdd={() => add("expense")}
              onChange={change}
              onRemove={remove}
              onMove={move}
            />
            <BalanceSection entries={entries} distribution={distribution} onDistributionChange={updateDistribution} />
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
