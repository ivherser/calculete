import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter, credentialsSchema } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAdminSupabase } from "@/lib/supabase/admin";

const allowSignup = createRateLimiter(5, 10 * 60 * 1000);

function fail(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

/** Alta con email + contraseña sin email de confirmación: la cuenta se crea ya confirmada. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return fail(403, "forbidden");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowSignup(ip)) return fail(429, "over_request_rate_limit");

  const body: unknown = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input");
  // Las cuentas se crean confirmadas: si se permitiera registrar un email de ADMIN_EMAILS,
  // cualquiera podría reclamarlo antes que su dueño y entrar en /admin.
  if (isAdminEmail(parsed.data.email)) return fail(400, "signup_failed");

  const admin = getAdminSupabase();
  if (!admin) return fail(503, "signup_not_configured");

  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") return fail(409, "user_already_exists");
    if (error.code === "weak_password") return fail(400, "weak_password");
    return fail(500, "signup_failed");
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
