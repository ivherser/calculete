"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Modal } from "./Modal";

type Mode = "magic" | "password";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const supabase = getBrowserSupabase();

  async function run(action: "magic" | "signin" | "signup") {
    if (!supabase) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
      setMessage({ kind: "error", text: "Introduce un email válido." });
      return;
    }
    if (action !== "magic" && (password.length < 8 || password.length > 72)) {
      setMessage({ kind: "error", text: "La contraseña debe tener entre 8 y 72 caracteres." });
      return;
    }

    setBusy(true);
    setMessage(null);
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    try {
      if (action === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail, options: { emailRedirectTo } });
        if (error) throw error;
        setMessage({ kind: "ok", text: "Te hemos enviado un enlace de acceso. Revisa tu correo." });
      } else if (action === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        setPassword("");
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo },
        });
        if (error) throw error;
        setPassword("");
        if (data.session) onClose();
        else setMessage({ kind: "ok", text: "Cuenta creada. Confirma tu email desde el enlace que te hemos enviado." });
      }
    } catch {
      setMessage({
        kind: "error",
        text:
          action === "signin"
            ? "Email o contraseña incorrectos."
            : "No se ha podido completar la operación. Inténtalo de nuevo.",
      });
    } finally {
      setBusy(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-800"
    }`;

  return (
    <Modal open={open} onClose={onClose} title="Inicia sesión en calculete">
      <p className="mb-4 text-sm text-slate-600">
        Guarda tus datos en la nube y recupéralos desde cualquier dispositivo.
      </p>
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        <button type="button" className={tabClass(mode === "magic")} onClick={() => setMode("magic")}>
          Enlace mágico
        </button>
        <button type="button" className={tabClass(mode === "password")} onClick={() => setMode("password")}>
          Email y contraseña
        </button>
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run(mode === "magic" ? "magic" : "signin");
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="tu@email.com"
          />
        </label>
        {mode === "password" && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        )}
        {message && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ${
              message.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {mode === "magic" ? "Enviar enlace" : "Entrar"}
          </button>
          {mode === "password" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("signup")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Crear cuenta
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
