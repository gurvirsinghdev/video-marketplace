import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";

import { db } from "@/db/drizzle";
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

  getAuthenticatedUser: protectedProcedure.query(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const [dbUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, ctx.auth.properties.email))
        .limit(1)
        .execute();

      return dbUser;
    }),
  ),
});
