import { createTRPCRouter, protectedProcedure } from "../init";
import { minLength, object, pipe, string } from "valibot";

import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { userTable } from "@/db/schemas/app.schema";

export const userRouter = createTRPCRouter({
  finishOnboarding: protectedProcedure
    .input(
      object({
        name: pipe(
          string("You must enter your full name"),
          minLength(3, "Name must be atleast 3 characters long."),
        ),
      }),
    )
    .mutation(({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .update(userTable)
          .set({
            name: input.name,
            account_status: "fulfilled",
          })
          .where(eq(userTable.email, ctx.auth.properties.email))
          .execute();
      }),
    ),

  updateFullName: protectedProcedure
    .input(
      object({
        name: pipe(
          string("You must eneter the full name."),
          minLength(3, "Full name must be atleast 3 characters long."),
        ),
      }),
    )
    .mutation(({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .update(userTable)
          .set({ name: input.name })
          .where(eq(userTable.email, ctx.auth.properties.email))
          .execute();
      }),
    ),
});
