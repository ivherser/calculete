import { APP_VERSION } from "@/lib/version";
import { AuthForm } from "./AuthForm";

export function LoginScreen({ authError }: { authError: boolean }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold tracking-tight text-indigo-700">calculete</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600" title="Versión">
            {APP_VERSION}
          </span>
        </div>
        <p className="mt-2 text-slate-600">Planifica tus ingresos y gastos del año.</p>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {authError && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            El enlace no es válido o ha caducado. Vuelve a intentarlo.
          </p>
        )}
        <AuthForm />
      </div>
    </main>
  );
}
