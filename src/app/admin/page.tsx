import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/lib/admin";
import { annualAmount } from "@/lib/balance";
import { rowsToEntries, type EntryRow } from "@/lib/entries";
import { formatEuro } from "@/lib/format";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { MONTH_LABELS, PERIODICITY_LABELS, type Entry } from "@/lib/types";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · calculete",
  robots: { index: false, follow: false },
};

const MAX_USER_PAGES = 20;
const USERS_PER_PAGE = 1000;

interface AdminUser {
  id: string;
  email: string;
  lastSignIn: string | null;
  createdAt: string;
  entries: number;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });

function fmtDate(value: string | null): string {
  return value ? dateFmt.format(new Date(value)) : "—";
}

function EntriesList({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1 pr-2 font-medium">Concepto</th>
                <th className="py-1 pr-2 text-right font-medium">Cantidad</th>
                <th className="py-1 pr-2 font-medium">Periodicidad</th>
                <th className="py-1 pr-2 font-medium">Meses</th>
                <th className="py-1 text-right font-medium">Anual</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2">{e.concept || "Sin concepto"}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{formatEuro(e.amount)}</td>
                  <td className="py-1.5 pr-2">{PERIODICITY_LABELS[e.periodicity]}</td>
                  <td className="py-1.5 pr-2 text-xs text-slate-600">
                    {e.months.map((m) => MONTH_LABELS[m]).join(", ") || "—"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{formatEuro(annualAmount(e))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await getServerSupabase();
  const adminClient = getAdminSupabase();
  if (!supabase || !adminClient) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user, adminClient))) notFound();

  const users: AdminUser[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
    if (error) break;
    for (const u of data.users) {
      if (!u.last_sign_in_at) continue;
      users.push({ id: u.id, email: u.email ?? "(sin email)", lastSignIn: u.last_sign_in_at, createdAt: u.created_at, entries: 0 });
    }
    if (data.users.length < USERS_PER_PAGE) break;
  }

  const { data: countRows } = await adminClient.from("entries").select("user_id").limit(100_000);
  const counts = new Map<string, number>();
  for (const r of (countRows ?? []) as { user_id: string }[]) counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  for (const u of users) u.entries = counts.get(u.id) ?? 0;
  users.sort((a, b) => (b.lastSignIn ?? "").localeCompare(a.lastSignIn ?? ""));

  const rawSelected = (await searchParams).user;
  const parsedSelected = z.uuid().safeParse(Array.isArray(rawSelected) ? rawSelected[0] : rawSelected);
  const selected = parsedSelected.success ? users.find((u) => u.id === parsedSelected.data) ?? null : null;

  let selectedEntries: Entry[] = [];
  let selectedError = false;
  if (selected) {
    const { data, error } = await adminClient
      .from("entries")
      .select("id,user_id,kind,concept,amount,periodicity,months,position")
      .eq("user_id", selected.id)
      .order("position", { ascending: true });
    selectedError = Boolean(error);
    selectedEntries = rowsToEntries((data ?? []) as EntryRow[]);
  }
  const incomes = selectedEntries.filter((e) => e.kind === "income");
  const expenses = selectedEntries.filter((e) => e.kind === "expense");
  const totalIncome = incomes.reduce((a, e) => a + annualAmount(e), 0);
  const totalExpense = expenses.reduce((a, e) => a + annualAmount(e), 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-baseline gap-2 px-4 py-3">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">
            calculete
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{APP_VERSION}</span>
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Admin</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="mb-3 text-lg font-semibold">Usuarios ({users.length})</h1>
          {users.length === 0 ? (
            <p className="text-sm text-slate-400">Ningún usuario ha iniciado sesión todavía.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin?user=${u.id}`}
                    className={`block rounded-lg px-2 py-2 hover:bg-slate-50 ${selected?.id === u.id ? "bg-indigo-50" : ""}`}
                  >
                    <span className="block truncate text-sm font-medium">{u.email}</span>
                    <span className="block text-xs text-slate-500">
                      Último acceso: {fmtDate(u.lastSignIn)} · {u.entries} conceptos
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selected ? (
            <p className="py-10 text-center text-sm text-slate-400">Selecciona un usuario para ver sus datos.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{selected.email}</h2>
                <p className="text-xs text-slate-500">
                  ID: {selected.id} · Alta: {fmtDate(selected.createdAt)} · Último acceso: {fmtDate(selected.lastSignIn)}
                </p>
              </div>
              {selectedError && <p className="text-sm text-rose-700">No se han podido cargar los datos del usuario.</p>}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-emerald-50 p-3">
                  Ingresos/año<strong className="block text-emerald-700">{formatEuro(totalIncome)}</strong>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  Gastos/año<strong className="block text-rose-700">{formatEuro(totalExpense)}</strong>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  Beneficio<strong className="block text-indigo-700">{formatEuro(totalIncome - totalExpense)}</strong>
                </div>
              </div>
              <EntriesList title="Ingresos" entries={incomes} />
              <EntriesList title="Gastos" entries={expenses} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
