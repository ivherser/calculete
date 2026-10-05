"use client";

import { MONTH_LABELS } from "@/lib/types";

interface MonthMatrixProps {
  months: number[];
  tone: "income" | "expense";
  conceptLabel: string;
  onToggle: (month: number) => void;
}

export function MonthMatrix({ months, tone, conceptLabel, onToggle }: MonthMatrixProps) {
  const active = new Set(months);
  const on = tone === "income" ? "bg-emerald-500 text-white border-emerald-500" : "bg-rose-500 text-white border-rose-500";
  return (
    <div className="grid grid-cols-12 gap-1" role="group" aria-label={`Meses de ${conceptLabel}`}>
      {MONTH_LABELS.map((label, m) => {
        const isOn = active.has(m);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isOn}
            aria-label={`${label}${isOn ? " (marcado)" : ""}`}
            onClick={() => onToggle(m)}
            className={`h-8 min-w-9 rounded-md border text-[10px] font-semibold transition ${
              isOn ? on : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
