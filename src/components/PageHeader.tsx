import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { PageNav } from "./PageNav";

/** Cabecera de las páginas secundarias (/sol, /task). */
export function PageHeader({ current }: { current: "/sol" | "/task" }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700 hover:text-indigo-800">
            calculete
          </Link>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600" title="Versión">
            {APP_VERSION}
          </span>
        </div>
        <PageNav current={current} />
      </div>
    </header>
  );
}
