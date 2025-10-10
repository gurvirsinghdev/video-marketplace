import { baseProcedure, createTRPCRouter } from "../init";

import { TRPCError } from "@trpc/server";
import { authRouter } from "./auth.router";

export function pipeThroughTRPCErrorHandler<T extends () => ReturnType<T>>(
  callbackFn: T,
): ReturnType<T> {
  try {
    return callbackFn();
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error, Please try again later!",
    });
  }
}

export const appRouter = createTRPCRouter({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
