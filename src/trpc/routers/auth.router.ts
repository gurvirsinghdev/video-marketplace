import { baseProcedure, createTRPCRouter, protectedDBProcedure } from "../init";

import { eq } from "drizzle-orm";
import { getAuth } from "@/auth/actions";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { userTable } from "@/db/schemas/app.schema";

export const authRouter = createTRPCRouter({
  getAuthState: baseProcedure.query(() =>
    pipeThroughTRPCErrorHandler(async () => {
      return await getAuth();
    }),
  ),

  getAuthenticatedUser: protectedDBProcedure.query(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const [dbUser] = await ctx.db
        .select()
        .from(userTable)
        .where(eq(userTable.email, ctx.auth.properties.email))
        .limit(1)
        .execute();
      return dbUser ?? null;
    }),
  ),
});
