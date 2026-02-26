import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { DailySoftResetGate } from "@/components/providers/DailySoftResetGate";
import { DayBoundaryProvider } from "@/components/providers/DayBoundaryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Performly",
  description: "Clareza Radical → Execução Consistente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <DailySoftResetGate />
        <DayBoundaryProvider>
          <AppLayout>{children}</AppLayout>
        </DayBoundaryProvider>
      </body>
    </html>
  );
}
