import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "calculete",
  description: "Calcula tus ingresos, gastos y balance anual.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
