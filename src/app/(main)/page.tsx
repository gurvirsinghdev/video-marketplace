"use client";

import { useAuthQuery } from "@/hooks/use-auth";

export default function HomePage() {
  const authQuery = useAuthQuery();
  return <p>{authQuery.data?.properties?.email}</p>;
}
