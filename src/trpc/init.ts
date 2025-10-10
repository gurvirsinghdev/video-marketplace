import SuperJSON from "superjson";
import { cache } from "react";
import { getAuth } from "@/auth/actions";
import { initTRPC } from "@trpc/server";

export const createTRPCContext = cache(async () => {
  const auth = getAuth();
  return {
    auth,
  };
});
export type TRPCContext = ReturnType<Awaited<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: SuperJSON,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
