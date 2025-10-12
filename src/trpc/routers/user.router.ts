import {
  Configuration,
  getConnectedAccountUsingId,
} from "@/sdk/stripe/get-connected-account-using-id";
import { and, eq } from "drizzle-orm";
import {
  createStripeMerchantAccount,
  extendBaseCreateCorePayload,
} from "@/sdk/stripe/create-stripe-merchant-account";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, minLength, object, pipe, string } from "valibot";
import {
  getStripeIntegrationByEmail,
  getUserByEmail,
} from "@/lib/server.utils";
import { integrationTable, userTable } from "@/db/schemas/app.schema";

import { CountryCodeEnum } from "@/config/stripe.config";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { buildStringSchema } from "@/lib/utils";
import { db } from "@/db/drizzle";
import { pipeThroughTRPCErrorHandler } from "./_app";

interface StripeIntegrationMetadata {
  account_id: string;
  configuration: Configuration | undefined;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Main user router
export const userRouter = createTRPCRouter({
  finishOnboarding: protectedProcedure
    .input(
      object({
        name: buildStringSchema([
          "You must enter your full name.",
          "Name must be atleast 3 characters long.",
        ]),

        registered_name: buildStringSchema([
          "You must exact registered name.",
          "Name must be atleast 3 characters long.",
        ]),
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
            .map((type) => ({ [type]: type }))
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
        name: buildStringSchema([
          "You must enter your full name.",
          "Name must be atleast 3 characters long.",
        ]),
      }),
    )
    .mutation(async ({ input, ctx }) =>
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

  enableStripeIntegration: protectedProcedure.mutation(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const integration = await getStripeIntegrationByEmail(
        ctx.auth.properties.email,
      );

      let metadata: Partial<StripeIntegrationMetadata> = {};

      if (!integration) {
        const user = await getUserByEmail(ctx.auth.properties.email);

        // Create Stripe Merchant Account
        const { id } = await createStripeMerchantAccount(
          extendBaseCreateCorePayload({
            contact_email: user.email,
            display_name: user.name!,
            identity: {
              business_details: {
                registered_name: user.registered_name!,
              },
              country: user.country!,
              entity_type: user.account_type!,
            },
          }),
        );

        metadata = {
          account_id: id,
          configuration: undefined,
        };

        // Insert integration into DB
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
        metadata = integration.metadata as Partial<StripeIntegrationMetadata>;

        if (!metadata.account_id) {
          if (!metadata.account_id) {
            await db
              .delete(integrationTable)
              .where(eq(integrationTable.id, integration.id))
              .execute();

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Unable to link Stripe account. Please try reconnecting from the dashboard.",
            });
          }
        }

        const connectedAccount = await getConnectedAccountUsingId(
          metadata.account_id,
        );

        const stripeStatus =
          connectedAccount.configuration.merchant.capabilities.card_payments
            .status;
        const stripeOnboarded = stripeStatus === "active";

        // Update integration status
        await db
          .update(integrationTable)
          .set({
            active: stripeOnboarded,
            updated_at: new Date(),
          })
          .where(eq(integrationTable.id, integration.id))
          .execute();

        if (stripeOnboarded) {
          return {
            onboarded: true,
            public_client_secret: null,
          };
        }
      }

      const accountSession = await stripe.accountSessions.create({
        account: metadata!.account_id!,
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
    }),
  ),

  syncStripeAccountStatus: protectedProcedure.mutation(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const integration = await getStripeIntegrationByEmail(
        ctx.auth.properties.email,
      );

      if (!integration) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please enable the Stripe integration from your dashboard.",
        });
      }

      const metadata = integration.metadata as StripeIntegrationMetadata;

      if (!metadata.account_id) {
        await db
          .delete(integrationTable)
          .where(eq(integrationTable.id, integration.id))
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

      console.log(
        connectedAccount.configuration.merchant.capabilities.card_payments,
      );

      if (
        connectedAccount.configuration.merchant.capabilities.card_payments
          .status === "active"
      ) {
        await db
          .update(integrationTable)
          .set({
            active: true,
            metadata: {
              ...metadata,
              configuration: connectedAccount.configuration,
            },
          })
          .where(eq(integrationTable.id, integration.id))
          .execute();
        return true;
      }
      return false;
    }),
  ),

  disableStripeIntegration: protectedProcedure.mutation(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const integration = await getStripeIntegrationByEmail(
        ctx.auth.properties.email,
      );
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

  getLinkedServices: protectedProcedure.query(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const integrations = await db
        .select()
        .from(integrationTable)
        .where(eq(integrationTable.user_email, ctx.auth.properties.email))
        .execute();

      return integrations.map((integration) => ({
        service: integration.service,
        active: integration.active,
      }));
    }),
  ),
});
