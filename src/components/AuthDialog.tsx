"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Modal } from "./Modal";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Tienes que confirmar tu email antes de entrar. Revisa tu correo (y la carpeta de spam).",
  user_already_exists: "Ya existe una cuenta con ese email. Pulsa «Entrar».",
  email_exists: "Ya existe una cuenta con ese email. Pulsa «Entrar».",
  weak_password: "La contraseña es demasiado débil. Usa una más larga o con más variedad de caracteres.",
  signup_disabled: "El registro de cuentas nuevas está desactivado.",
  email_provider_disabled: "El acceso con email y contraseña está desactivado en Supabase.",
  over_email_send_rate_limit: "Se han enviado demasiados emails. Espera unos minutos y vuelve a intentarlo.",
  over_request_rate_limit: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  email_address_invalid: "Ese email no es válido.",
};

function authErrorMessage(error: unknown, action: "signin" | "signup"): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  if (error instanceof TypeError) return "No se ha podido conectar con el servidor. Revisa tu conexión.";
  return action === "signin"
    ? "No se ha podido iniciar sesión. Inténtalo de nuevo."
    : "No se ha podido crear la cuenta. Inténtalo de nuevo.";
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M3 3l18 18" />}
    </svg>
  );
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const supabase = getBrowserSupabase();

  async function run(action: "signin" | "signup") {
    if (!supabase) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
      setMessage({ kind: "error", text: "Introduce un email válido." });
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setMessage({ kind: "error", text: "La contraseña debe tener entre 8 y 72 caracteres." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      if (action === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        setPassword("");
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setPassword("");
        if (data.session) onClose();
        else setMessage({ kind: "ok", text: "Cuenta creada. Confirma tu email desde el enlace que te hemos enviado." });
      }
    } catch (error) {
      setMessage({ kind: "error", text: authErrorMessage(error, action) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Inicia sesión en calculete">
      <p className="mb-4 text-sm text-slate-600">
        Guarda tus datos en la nube y recupéralos desde cualquier dispositivo.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run("signin");
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
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Contraseña</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-800"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </label>
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
            Entrar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("signup")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Crear cuenta
          </button>
        </div>
      </form>
    </Modal>
  );
}
