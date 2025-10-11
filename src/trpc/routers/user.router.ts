import { and, eq } from "drizzle-orm";
import {
  createStripeMerchantAccount,
  extendBaseCreateCorePayload,
  getConnectedAccountUsingId,
} from "@/sdk/stripe/accounts";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, minLength, object, pipe, string } from "valibot";
import { integrationTable, userTable } from "@/db/schemas/app.schema";

import { CountryCodeEnum } from "@/config/stripe.config";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { db } from "@/db/drizzle";
import { pipeThroughTRPCErrorHandler } from "./_app";

interface StripeIntegrationMetadata {
  account_id: string;
  onboarded: boolean;
  card_payments?: {
    status: "active" | "pending" | "restricted";
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
      }),
    )
    .mutation(({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .update(userTable)
          .set({
            name: input.name,
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

      let metadata: StripeIntegrationMetadata | undefined = undefined;

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

        const { id } = await createStripeMerchantAccount(
          extendBaseCreateCorePayload({
            contact_email: dbUser.email,
            display_name: dbUser.name!,
            identity: {
              business_details: {
                registered_name: dbUser.registered_name!,
              },
              country: dbUser.country!,
              entity_type: dbUser.account_type!,
            },
          }),
        );

        metadata = {
          account_id: id,
          onboarded: false,
        };
        await db
          .insert(integrationTable)
          .values({
            user_email: ctx.auth.properties.email,
            active: false,
            service: "stripe",
            metadata,
          })
          .execute();
      } else {
        metadata = integration.metadata as
          | StripeIntegrationMetadata
          | undefined;

        await db
          .update(integrationTable)
          .set({
            active: metadata?.onboarded,
            updated_at: new Date(),
          })
          .where(eq(integrationTable.id, integration.id))
          .execute();
      }

      if (!metadata?.onboarded) {
        const accountSession = await stripe.accountSessions.create({
          account: metadata!.account_id,
          components: {
            account_onboarding: {
              enabled: true,
            },
          },
        });

        return {
          onboarded: false,
          public_client_secret: accountSession.client_secret,
        };
      }

      return {
        onboarded: true,
        public_client_secret: null,
      };
    }),
  ),

  syncStripeAccountStatus: protectedProcedure.mutation(({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const [stripeIntegration] = await db
        .select()
        .from(integrationTable)
        .where(
          and(
            eq(integrationTable.user_email, ctx.auth.properties.email),
            eq(integrationTable.service, "stripe"),
          ),
        )
        .execute();

      if (!stripeIntegration) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please enable the Stripe integration from your dashboard.",
        });
      }

      const metadata = stripeIntegration.metadata as StripeIntegrationMetadata;
      if (!metadata || !metadata.account_id) {
        await db
          .delete(integrationTable)
          .where(eq(integrationTable.id, stripeIntegration.id))
          .execute();

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Unable to link Stripe account. Please try reconnecting from the dashboard.",
        });
      }

      const connectedAccount = await getConnectedAccountUsingId(
        metadata.account_id,
      );

      if (
        connectedAccount.configuration.merchant.card_payments.status ===
        "active"
      ) {
        await db
          .update(integrationTable)
          .set({
            active: true,
            metadata: {
              ...metadata,
              onboarded: true,
              card_payments:
                connectedAccount.configuration.merchant.card_payments,
            },
          })
          .where(eq(integrationTable.id, stripeIntegration.id))
          .execute();
        return true;
      }
      return false;
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
