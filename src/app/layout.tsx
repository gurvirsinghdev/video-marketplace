import "./globals.css";

import { DM_Mono, DM_Sans } from "next/font/google";

import type { Metadata } from "next";
import NextThemesProvider from "@/providers/next-themes-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";

const sansFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const monoFont = DM_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VidID Pro - Stock Video Licensing Platform",
  description:
    "VidID Pro, is a stock video licensing platform with thousands of stock videos avaiable in multiple categories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${sansFont.variable} ${monoFont.variable} antialiased`}
        >
          <NextThemesProvider>
            {children}
            <Toaster richColors />
          </NextThemesProvider>
        </body>
      </html>
    </TRPCReactProvider>
  );
}
