import { TRPCError, initTRPC } from "@trpc/server";

import SuperJSON from "superjson";
import { cache } from "react";
import { getAuth } from "@/auth/actions";
import { pipeThroughTRPCErrorHandler } from "./routers/_app";

export const createTRPCContext = cache(async () => {
  const auth = await getAuth();
  return {
    auth,
  };
});
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: SuperJSON,
});

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) =>
    pipeThroughTRPCErrorHandler(async () => {
      if (!ctx.auth) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to access this resource.",
        });
      }

      return next({
        ctx: {
          ...ctx,
          auth: ctx.auth!,
        },
      });
    }),
  ),
);
