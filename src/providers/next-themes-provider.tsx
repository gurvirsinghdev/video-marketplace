"use client";

import { ThemeProvider } from "next-themes";

export default function NextThemesProvider(
  props: Readonly<{ children: React.ReactNode }>,
) {
  return (
    <ThemeProvider enableSystem attribute={"class"} disableTransitionOnChange>
      {props.children}
    </ThemeProvider>
  );
}
