import type { Metadata } from "next";
import { Inter, Stardos_Stencil } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const stardos = Stardos_Stencil({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-stardos",
});

export const metadata: Metadata = {
  title: "Missão Lanchonete",
  description: "Delivery da Missão Lanchonete",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${stardos.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}