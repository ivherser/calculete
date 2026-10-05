"use client";

import { useState } from "react";
import { emailSchema, PASSWORD_HINT, PASSWORD_MAX, passwordSchema } from "@/lib/auth";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Modal } from "./Modal";
import { PasswordInput } from "./PasswordInput";

type Mode = "signin" | "signup" | "recover";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Esta cuenta no tiene el email confirmado. Recupera la contraseña para activarla.",
  user_already_exists: "Ya existe una cuenta con ese email. Inicia sesión o recupera la contraseña.",
  weak_password: "La contraseña es demasiado débil. Usa una más larga o con más variedad de caracteres.",
  signup_not_configured: "El registro no está disponible: falta configurar el servidor.",
  over_email_send_rate_limit: "Se han enviado demasiados emails. Espera unos minutos y vuelve a intentarlo.",
  over_request_rate_limit: "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  network: "No se ha podido conectar con el servidor. Revisa tu conexión.",
};

const TITLES: Record<Mode, string> = {
  signin: "Inicia sesión en calculete",
  signup: "Crea tu cuenta de calculete",
  recover: "Recupera tu contraseña",
};

function errorCode(error: unknown): string {
  if (error instanceof TypeError) return "network";
  if (error instanceof Error && error.name === "AuthRetryableFetchError") return "network";
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

async function createAccount(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return;
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
  throw { code: typeof body?.error === "string" ? body.error : "" };
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const supabase = getBrowserSupabase();

  const switchMode = (next: Mode) => {
    setMode(next);
    setMessage(null);
  };

  async function submit() {
    if (!supabase) return;
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setMessage({ kind: "error", text: "Introduce un email válido." });
      return;
    }
    if (mode === "signup" && !passwordSchema.safeParse(password).success) {
      setMessage({ kind: "error", text: PASSWORD_HINT });
      return;
    }
    if (mode === "signin" && (password.length === 0 || password.length > PASSWORD_MAX)) {
      setMessage({ kind: "error", text: "Introduce tu contraseña." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}/auth/callback?next=/restablecer`,
        });
        if (error) throw error;
        setMessage({
          kind: "ok",
          text: "Si existe una cuenta con ese email, te hemos enviado un enlace para poner una contraseña nueva. Ábrelo en este mismo navegador.",
        });
        return;
      }
      if (mode === "signup") await createAccount(parsedEmail.data, password);
      const { error } = await supabase.auth.signInWithPassword({ email: parsedEmail.data, password });
      if (error) throw error;
      setPassword("");
      onClose();
    } catch (error) {
      const fallback =
        mode === "signup" ? "No se ha podido crear la cuenta. Inténtalo de nuevo." : "No se ha podido completar la operación. Inténtalo de nuevo.";
      setMessage({ kind: "error", text: AUTH_ERRORS[errorCode(error)] ?? fallback });
    } finally {
      setBusy(false);
    }
  }

  const linkClass = "font-medium text-indigo-600 hover:text-indigo-800";

  return (
    <Modal open={open} onClose={onClose} title={TITLES[mode]}>
      <p className="mb-4 text-sm text-slate-600">
        {mode === "recover"
          ? "Te enviaremos un enlace a tu email para que pongas una contraseña nueva."
          : "Guarda tus datos en la nube y recupéralos desde cualquier dispositivo."}
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
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
        {mode !== "recover" && (
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        )}
        {mode === "signin" && (
          <div className="text-right text-sm">
            <button type="button" className={linkClass} onClick={() => switchMode("recover")}>
              ¿Has olvidado tu contraseña?
            </button>
          </div>
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
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {mode === "signin" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
        </button>
        <p className="pt-1 text-center text-sm text-slate-600">
          {mode === "signin" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button type="button" className={linkClass} onClick={() => switchMode("signup")}>
                Crear cuenta
              </button>
            </>
          ) : (
            <button type="button" className={linkClass} onClick={() => switchMode("signin")}>
              Volver a iniciar sesión
            </button>
          )}
        </p>
      </form>
    </Modal>
  );
}
