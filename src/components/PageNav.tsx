import Link from "next/link";

const LINKS = [
  { href: "/", label: "Calculete" },
  { href: "/sol", label: "Sol" },
  { href: "/task", label: "Task" },
] as const;

/** Botones de navegación entre las páginas de calculete. */
export function PageNav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <nav className="flex items-center gap-1" aria-label="Páginas">
      {LINKS.filter((l) => l.href !== "/" || current !== "/").map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === current ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            l.href === current ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
