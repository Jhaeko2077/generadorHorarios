import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/AppShell";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Generador Vida y Ministerio - Umachiri",
  description: "Aplicacion interna para asignaciones semanales.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${lora.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
