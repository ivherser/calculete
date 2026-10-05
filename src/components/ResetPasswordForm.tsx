"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PASSWORD_HINT, passwordSchema } from "@/lib/auth";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { PasswordInput } from "./PasswordInput";

type Status = "checking" | "ready" | "no-session" | "saving" | "done";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>(() => (getBrowserSupabase() ? "checking" : "no-session"));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setStatus(data.user ? "ready" : "no-session"));
  }, []);

  async function save() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    if (!passwordSchema.safeParse(password).success) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError(null);
    setStatus("saving");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.code === "same_password"
          ? "La contraseña nueva debe ser distinta de la anterior."
          : updateError.code === "weak_password"
            ? "Supabase no acepta una contraseña tan corta (por defecto exige 6 caracteres como mínimo)."
            : "No se ha podido guardar la contraseña. Inténtalo de nuevo.",
      );
      setStatus("ready");
      return;
    }
    setStatus("done");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Nueva contraseña</h1>
      {status === "checking" && <p className="text-sm text-slate-500">Comprobando el enlace…</p>}
      {status === "no-session" && (
        <p className="text-sm text-slate-600">
          El enlace no es válido o ha caducado. Vuelve a pedirlo desde «¿Has olvidado tu contraseña?» y ábrelo en este
          mismo navegador. <Link href="/" className="font-medium text-indigo-600">Volver a calculete</Link>
        </p>
      )}
      {status === "done" && (
        <p className="text-sm text-emerald-800">
          Contraseña actualizada. <Link href="/" className="font-medium text-indigo-600">Ir a calculete</Link>
        </p>
      )}
      {(status === "ready" || status === "saving") && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" label="Contraseña nueva" />
          <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" label="Repite la contraseña" />
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "saving"}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Guardar contraseña
          </button>
        </form>
      )}
    </div>
  );
}
