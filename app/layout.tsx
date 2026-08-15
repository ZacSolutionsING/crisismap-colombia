import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Fuentes optimizadas
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "CrisisMap Colombia",
  description: "Reporte de emergencias durante desastres naturales",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased bg-gray-50">{children}</body>
    </html>
  );
}
