import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerPortal } from "@/components/player/PlayerPortal";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stream King",
  description: "Premium streaming experience powered by RealDebrid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <PlayerPortal />
      </body>
    </html>
  );
}
