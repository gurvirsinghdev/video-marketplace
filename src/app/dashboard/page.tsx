"use client";

import { Loader2Icon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { isPending, data } = useAuth();

  return (
    <main className="grid h-screen w-screen place-items-center">
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <span>{data?.properties.email}</span>
      )}
    </main>
  );
}
