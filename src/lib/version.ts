/**
 * Versión mostrada en la cabecera: `v1.<número de PR>`.
 * Se puede sobrescribir con NEXT_PUBLIC_APP_VERSION (p. ej. desde Vercel o CI).
 */
export const DEFAULT_APP_VERSION = "v1.1";

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || DEFAULT_APP_VERSION;
