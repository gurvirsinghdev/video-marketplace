import "server-only";

import { appRouter } from "./routers/_app";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpc = appRouter.createCaller(createTRPCContext);
