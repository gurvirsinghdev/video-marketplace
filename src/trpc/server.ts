import "server-only";

import { appRouter } from "./routers/_app";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const caller = appRouter.createCaller(createTRPCContext);

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
