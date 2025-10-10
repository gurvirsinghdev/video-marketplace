import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useAuth() {
  const trpc = useTRPC();
  return useQuery(trpc.auth.whoAmI.queryOptions());
}
