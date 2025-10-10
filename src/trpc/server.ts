import "server-only";

import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers/_app";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpc = appRouter.createCaller(createTRPCContext);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function callTrpcWithFallback<T extends () => Promise<any>>(
  callbackFn: T,
): Promise<Awaited<ReturnType<T>> | null> {
  return new Promise(async (resolve) => {
    try {
      const result = await callbackFn();
      resolve(result);
    } catch (err) {
      console.error((err as Error).message);
      resolve(null);
    }
  });
}
