import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return envList("ADMIN_EMAILS").includes(email.trim().toLowerCase());
}

/**
 * Un usuario es admin si su id está en ADMIN_USER_IDS, su email (confirmado) está en
 * ADMIN_EMAILS, o existe en la tabla `public.admins` (consultada con service role).
 */
export async function isAdmin(user: User, adminClient: SupabaseClient): Promise<boolean> {
  if (envList("ADMIN_USER_IDS").includes(user.id.toLowerCase())) return true;

  const email = user.email?.toLowerCase();
  if (email && user.email_confirmed_at && isAdminEmail(email)) return true;

  const { data, error } = await adminClient.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return !error && Boolean(data);
}
