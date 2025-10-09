import { subscribe } from "diagnostics_channel";
import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import NextThemesProvider from "@/providers/next-themes-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${sansFont.variable} ${monoFont.variable} antialiased`}>
        <NextThemesProvider>{children}</NextThemesProvider>
      </body>
    </html>
  );
}
