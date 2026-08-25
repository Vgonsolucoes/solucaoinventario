import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solução Inventário - Gestão de Patrimônio",
  description:
    "Sistema de gestão de patrimônio e inventário da Solução Equipamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-solucao-light">
        {children}
      </body>
    </html>
  );
}
