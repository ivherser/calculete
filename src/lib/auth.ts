import { z } from "zod";

export const PASSWORD_MIN = 1;
export const PASSWORD_MAX = 72;

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
export const PASSWORD_HINT = `Introduce una contraseña de como máximo ${PASSWORD_MAX} caracteres.`;

/** Contraseñas nuevas (alta y restablecimiento). */
export const passwordSchema = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX);
export const credentialsSchema = z.object({ email: emailSchema, password: passwordSchema });

const ALLOWED_NEXT_PATHS = new Set(["/", "/restablecer"]);

/** Solo permite redirigir a rutas internas conocidas (evita open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  return next && ALLOWED_NEXT_PATHS.has(next) ? next : "/";
}

/** Limitador en memoria por clave (best effort: cada instancia serverless tiene el suyo). */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) hits.clear();
    return true;
  };
}
