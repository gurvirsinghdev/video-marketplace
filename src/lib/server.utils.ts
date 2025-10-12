"server-only";

import { and, eq } from "drizzle-orm";
import { integrationTable, userTable } from "@/db/schemas/app.schema";

import { TRPCError } from "@trpc/server";
import { db } from "@/db/drizzle";

export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)
    .execute();
  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unable to verify account. Please log out and log back in.",
    });
  }

  return user;
};

export const getStripeIntegrationByEmail = async (email: string) => {
  const [integration] = await db
    .select()
    .from(integrationTable)
    .where(
      and(
        eq(integrationTable.user_email, email),
        eq(integrationTable.service, "stripe"),
      ),
    )
    .limit(1)
    .execute();
  return integration;
};
