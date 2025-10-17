import {
  Configuration,
  getConnectedAccountUsingId,
} from "@/sdk/stripe/get-connected-account-using-id";
import {
  createStripeMerchantAccount,
  extendBaseCreateCorePayload,
} from "@/sdk/stripe/create-stripe-merchant-account";
import { createTRPCRouter, protectedDBProcedure } from "../init";
import { enum_, object } from "valibot";
import {
  getStripeIntegrationByEmail,
  getUserByEmail,
} from "@/lib/server.utils";
import { integrationTable, userTable } from "@/db/schemas/app.schema";

import { CountryCodeEnum } from "@/config/stripe.config";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { buildStringSchema } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { pipeThroughTRPCErrorHandler } from "./_app";

interface StripeIntegrationMetadata {
  account_id: string;
  configuration: Configuration | undefined;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Main user router
export const userRouter = createTRPCRouter({
  finishOnboarding: protectedDBProcedure
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
    .mutation(
      async ({ input, ctx }) =>
        await pipeThroughTRPCErrorHandler(async () => {
          await ctx.db
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

  updateAccountDetails: protectedDBProcedure
    .input(
      object({
        name: buildStringSchema([
          "You must enter your full name.",
          "Name must be atleast 3 characters long.",
        ]),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await pipeThroughTRPCErrorHandler(async () => {
          await ctx.db
            .update(userTable)
            .set({
              name: input.name,
              updated_at: new Date(),
            })
            .where(eq(userTable.email, ctx.auth.properties.email))
            .execute();
        }),
    ),

  enableStripeIntegration: protectedDBProcedure.mutation(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const integration = await getStripeIntegrationByEmail(
          ctx.db,
          ctx.auth.properties.email,
        );

        let metadata: Partial<StripeIntegrationMetadata> = {};

        if (!integration) {
          const user = await getUserByEmail(ctx.db, ctx.auth.properties.email);

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
          await ctx.db
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
            await ctx.db
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

          const stripeStatus =
            connectedAccount.configuration.merchant.capabilities.card_payments
              .status;
          const stripeOnboarded = stripeStatus === "active";

          // Update integration status
          await ctx.db
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

  syncStripeAccountStatus: protectedDBProcedure.mutation(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const integration = await getStripeIntegrationByEmail(
          ctx.db,
          ctx.auth.properties.email,
        );

        if (!integration) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Please enable the Stripe integration from your dashboard.",
          });
        }

        const metadata = integration.metadata as StripeIntegrationMetadata;

        if (!metadata.account_id) {
          await ctx.db
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

        if (
          connectedAccount.configuration.merchant.capabilities.card_payments
            .status === "active"
        ) {
          await ctx.db
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

  disableStripeIntegration: protectedDBProcedure.mutation(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const integration = await getStripeIntegrationByEmail(
          ctx.db,
          ctx.auth.properties.email,
        );
        if (!integration) return;

        await ctx.db
          .update(integrationTable)
          .set({
            active: false,
            updated_at: new Date(),
          })
          .where(eq(integrationTable.id, integration.id))
          .execute();
      }),
  ),

  getLinkedServices: protectedDBProcedure.query(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const integrations = await ctx.db
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
