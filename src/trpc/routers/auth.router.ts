import { baseProcedure, createTRPCRouter } from "../init";

import { getAuth } from "@/auth/actions";
import { pipeThroughTRPCErrorHandler } from "./_app";

export const authRouter = createTRPCRouter({
  whoAmI: baseProcedure.query(() =>
    pipeThroughTRPCErrorHandler(async () => {
      return await getAuth();
    }),
  ),
});
