import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useAuthQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.auth.getAuthState.queryOptions(undefined));
}
