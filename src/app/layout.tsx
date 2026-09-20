import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Elite Squad Tracker",
    template: "%s · Elite Squad Tracker",
  },
  description:
    "Platform tracker mingguan program mentoring Elite Squad — kehadiran, self-check, pelaporan kendala, dan feedback sesi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f47f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
