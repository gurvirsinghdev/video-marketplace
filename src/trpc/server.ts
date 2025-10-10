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
