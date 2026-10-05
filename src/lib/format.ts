const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEuro(value: number): string {
  return currency.format(Math.round(value));
}

export function formatEuroPrecise(value: number): string {
  return currencyPrecise.format(value);
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 0 })} %`;
}
