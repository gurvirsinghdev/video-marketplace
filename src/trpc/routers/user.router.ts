import { and, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, minLength, object, pipe, string } from "valibot";
import { integrationTable, userTable } from "@/db/schemas/app.schema";

import { CountryCodeEnum } from "@/config/stripe.config";
import { TRPCError } from "@trpc/server";
import { db } from "@/db/drizzle";
import { pipeThroughTRPCErrorHandler } from "./_app";

export const userRouter = createTRPCRouter({
  finishOnboarding: protectedProcedure
    .input(
      object({
        name: pipe(
          string("You must enter your full name"),
          minLength(3, "Name must be atleast 3 characters long."),
        ),
        registered_name: pipe(
          string("You must enter your full name"),
          minLength(3, "Name must be atleast 3 characters long."),
        ),
        country: CountryCodeEnum,
        account_type: enum_(
          (
            [
              "company",
              "government_entity",
              "individual",
              "non_profit",
            ] as const
          )
            .map((value) => ({ [value]: value }))
            .reduce((acc, current) => ({ ...acc, ...current }), {}),
        ),
      }),
    )
    .mutation(({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .update(userTable)
          .set({
            name: input.name,
            account_type: input.account_type,
            country: input.country,
            registered_name: input.registered_name,
            account_status: "fulfilled",
            updated_at: new Date(),
          })
          .where(eq(userTable.email, ctx.auth.properties.email))
          .execute();
      }),
    ),

  updateAccountDetails: protectedProcedure
    .input(
      object({
        name: pipe(
          string("You must enter the full name."),
          minLength(3, "Full name must be atleast 3 characters long."),
        ),
        country: CountryCodeEnum,
      }),
    )
    .mutation(({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .update(userTable)
          .set({
            name: input.name,
            country: input.country,
            updated_at: new Date(),
          })
          .where(eq(userTable.email, ctx.auth.properties.email))
          .execute();
      }),
    ),

  getLinkedServices: protectedProcedure.query(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      return await db
        .select()
        .from(integrationTable)
        .where(eq(integrationTable.user_email, ctx.auth.properties.email))
        .execute();
    }),
  ),
  enableStripeIntegration: protectedProcedure.mutation(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const [integration] = await db
        .select()
        .from(integrationTable)
        .where(
          and(
            eq(integrationTable.user_email, ctx.auth.properties.email),
            eq(integrationTable.service, "stripe"),
          ),
        )
        .limit(1)
        .execute();

      if (!integration) {
        const [dbUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, ctx.auth.properties.email))
          .limit(1)
          .execute();
        if (!dbUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Your account information could not be verified. Please log out and log back in.",
          });
        }

        const request = await fetch("https://api.stripe.com/v2/core/accounts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!}`,
            "Stripe-Version": "2025-09-30.preview",
          },
          body: JSON.stringify({
            contact_email: ctx.auth.properties.email,
            display_name: dbUser.name,
            dashboard: "full",
            defaults: {
              currency: "usd",
              locales: ["en-US"],
              responsibilities: {
                fees_collector: "application",
                losses_collector: "stripe",
              },
            },
            identity: {
              business_details: {
                registered_name: dbUser.registered_name,
              },
              country: dbUser.country,
              entity_type: dbUser.account_type,
            },
            include: [
              "configuration.customer",
              "configuration.merchant",
              "identity",
              "requirements",
            ],
          }),
        });
        await db
          .insert(integrationTable)
          .values({
            user_email: ctx.auth.properties.email,
            active: true,
            service: "stripe",
          })
          .execute();
      } else {
        await db
          .update(integrationTable)
          .set({
            active: true,
            updated_at: new Date(),
          })
          .where(eq(integrationTable.id, integration.id))
          .execute();
      }
    }),
  ),

  disableStripeIntegration: protectedProcedure.mutation(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const [integration] = await db
        .select()
        .from(integrationTable)
        .where(
          and(
            eq(integrationTable.user_email, ctx.auth.properties.email),
            eq(integrationTable.service, "stripe"),
          ),
        )
        .limit(1)
        .execute();

      if (!integration) return;
      await db
        .update(integrationTable)
        .set({
          active: false,
          updated_at: new Date(),
        })
        .where(eq(integrationTable.id, integration.id))
        .execute();
    }),
  ),
});
