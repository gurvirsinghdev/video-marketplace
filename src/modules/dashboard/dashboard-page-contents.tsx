"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  children: React.ReactNode;
}
export default function DashboardPageContents(props: Props) {
  return (
    <section className={cn("p-4 py-6 sm:space-y-6", props.className)}>
      {props.children}
    </section>
  );
}
