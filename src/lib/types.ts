export const PERIODICITIES = [
  "mensual",
  "bimensual",
  "trimestral",
  "semestral",
  "anual",
  "puntual",
] as const;

export type Periodicity = (typeof PERIODICITIES)[number];

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
  mensual: "Mensual",
  bimensual: "Bimensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  puntual: "Puntual",
};

export type EntryKind = "income" | "expense";

export interface Entry {
  id: string;
  kind: EntryKind;
  concept: string;
  amount: number;
  periodicity: Periodicity;
  /** Meses activos: índices 0 (ENE) .. 11 (DIC), ordenados y sin duplicados. */
  months: number[];
}

export const MONTH_LABELS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;
