import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ClubOS - Smart Club Operations",
  description: "One passport for every fest. Discover events, collect stamps, and build your digital passport.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23C9A96E' rx='20' width='100' height='100'/><text y='0.65em' x='50%' text-anchor='middle' font-size='65' font-weight='bold' fill='%2314110B'>C</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
