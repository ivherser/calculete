import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SolarDiagram } from "@/components/sol/SolarDiagram";
import { TiltChart } from "@/components/sol/TiltChart";
import { TriangleCalculator } from "@/components/sol/TriangleCalculator";

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
      <PageHeader current="/sol" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <Section title="Ángulo óptimo de inclinación">
          <TiltChart />
        </Section>
        <Section title="Calculadora de triángulos">
          <TriangleCalculator />
        </Section>
        <Section title="Instalación solar">
          <SolarDiagram />
        </Section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">calculete</footer>
    </>
  );
}
