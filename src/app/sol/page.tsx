import type { Metadata } from "next";
import { SolarDiagram } from "@/components/sol/SolarDiagram";
import { TiltChart } from "@/components/sol/TiltChart";
import { TriangleCalculator } from "@/components/sol/TriangleCalculator";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = { title: "Sol · calculete", robots: { index: false } };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default function SolPage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-baseline gap-2 px-4 py-3">
          <span className="text-xl font-bold tracking-tight text-indigo-700">calculete</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600" title="Versión">
            {APP_VERSION}
          </span>
          <span className="text-sm font-medium text-slate-500">· Sol</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <Section title="Instalación solar">
          <SolarDiagram />
        </Section>
        <Section title="Ángulo óptimo de inclinación">
          <TiltChart />
        </Section>
        <Section title="Calculadora de triángulos">
          <TriangleCalculator />
        </Section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">calculete</footer>
    </>
  );
}
