import { email, enum_, number, object, optional, pipe, string } from "valibot";
import { createTRPCRouter, protectedDBProcedure } from "../init";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { licenseTable, videoTable } from "@/db/schemas/app.schema";
import { buildStringSchema } from "@/lib/utils";
import { desc, eq, sql } from "drizzle-orm";
import { getCloudfrontUrl, getOriginalUrl } from "@/lib/cloudfront";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripeIntegrationByEmail } from "@/lib/server.utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const pageSize = 5;
const createLicenseRequestSchema = object({
  licenseType: enum_({
    instant: "instant",
    custom: "custom",
  }),
  videoId: string(),
  usage: optional(string()),
  region: optional(string()),
  platforms: optional(string()),
  duration: optional(string()),
  budget: optional(string()),
  fullName: buildStringSchema("Full Name"),
  email: optional(pipe(string(), email())),
  purpose: optional(
    buildStringSchema(["Purpose", "Please provide a detailed purpose."]),
  ),
  quotePrice: optional(string()),
});
export const licenseRouter = createTRPCRouter({
  listMyLicensesRequestPagniated: protectedDBProcedure
    .input(object({ page: number() }))
    .query(async ({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [{ count }] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(licenseTable)
          .leftJoin(
            videoTable,
            eq(videoTable.user_email, ctx.auth.properties.email),
          )
          .where(eq(licenseTable.video_id, videoTable.id))
          .execute();

        const offset = (input.page - 1) * pageSize;
        const licenses = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(
            videoTable,
            eq(videoTable.user_email, ctx.auth.properties.email),
          )
          .where(eq(licenseTable.video_id, videoTable.id))
          .orderBy(desc(licenseTable.created_at))
          .offset(offset)
          .limit(pageSize)
          .execute();

        return {
          pageSize,
          pages: Math.ceil(count / pageSize),
          requests: licenses.map((license) => ({
            ...license,
            vididpro_video: {
              ...license.vididpro_video,
              thumbnail_key: getCloudfrontUrl(
                license.vididpro_video?.thumbnail_key,
              ),
              m3u8_key: getCloudfrontUrl(license.vididpro_video?.m3u8_key),
            },
          })),
        };
      }),
    ),

  listUserRequestedLicensesPaginated: protectedDBProcedure
    .input(object({ page: number() }))
    .query(async ({ input, ctx }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [{ count }] = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(licenseTable)
          .where(eq(licenseTable.user_email, ctx.auth.properties.email))
          .execute();

        const offset = (input.page - 1) * pageSize;
        const licenses = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(videoTable, eq(videoTable.id, licenseTable.video_id))
          .where(eq(licenseTable.user_email, ctx.auth.properties.email))
          .orderBy(desc(licenseTable.created_at))
          .offset(offset)
          .limit(pageSize)
          .execute();

        return {
          pageSize,
          pages: Math.ceil(count / pageSize),
          requests: licenses.map((license) => ({
            ...license,
            vididpro_video: {
              ...license.vididpro_video,
              thumbnail_key: getCloudfrontUrl(
                license.vididpro_video?.thumbnail_key,
              ),
              m3u8_key: getCloudfrontUrl(license.vididpro_video?.m3u8_key),
            },
          })),
        };
      }),
    ),

  setLicenseSettlePrice: protectedDBProcedure
    .input(
      object({
        licenseId: buildStringSchema("License Id"),
        settlePrice: string("Settle Price"),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        // Ensure the current user owns the video for this license
        const [licenseJoin] = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(videoTable, eq(videoTable.id, licenseTable.video_id))
          .where(eq(licenseTable.id, input.licenseId))
          .limit(1)
          .execute();

        if (
          !licenseJoin ||
          licenseJoin.vididpro_video?.user_email !== ctx.auth.properties.email
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not own this video.",
          });
        }

        const [{ price }] = await ctx.db
          .update(licenseTable)
          .set({ settle_price: input.settlePrice })
          .where(eq(licenseTable.id, input.licenseId))
          .returning({ price: licenseTable.settle_price })
          .execute();

        return { settle_price: price };
      }),
    ),
  setLicenseCreatorNotes: protectedDBProcedure
    .input(
      object({
        licenseId: buildStringSchema("License Id"),
        creatorNotes: buildStringSchema("Creator Notes"),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [licenseJoin] = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(videoTable, eq(videoTable.id, licenseTable.video_id))
          .where(eq(licenseTable.id, input.licenseId))
          .limit(1)
          .execute();

        if (
          !licenseJoin ||
          licenseJoin.vididpro_video?.user_email !== ctx.auth.properties.email
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not own this video.",
          });
        }

        await ctx.db
          .update(licenseTable)
          .set({ creator_notes: input.creatorNotes })
          .where(eq(licenseTable.id, input.licenseId))
          .execute();

        return true;
      }),
    ),
  createLicenseRequest: protectedDBProcedure
    .input(createLicenseRequestSchema)
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [videoData] = await ctx.db
          .select()
          .from(videoTable)
          .where(eq(videoTable.id, input.videoId))
          .limit(1)
          .execute();

        if (!videoData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The video you're trying to license does not exist.",
          });
        }

        if (videoData.user_email === ctx.auth.properties.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot request a license for your own video.",
          });
        }

        if (input.licenseType === "instant") {
          const headerMap = await headers();
          const host = headerMap.get("host");

          console.log(videoData.user_email);
          const integration = await getStripeIntegrationByEmail(
            ctx.db,
            videoData.user_email,
          );
          if (!integration.active) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "The uploader of this video has temporarily disabled payments.",
            });
          }
          const destinationAccountId = (
            integration.metadata as { account_id?: string } | undefined
          )?.account_id;

          if (!destinationAccountId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "The uploader of this video has temporarily disabled payments.",
            });
          }

          // Create Stripe session and an instant license row
          const checkoutSession = await stripe.checkout.sessions.create({
            payment_intent_data: {
              application_fee_amount: Math.round(+videoData.price * 100 * 0.5),
              transfer_data: {
                destination: destinationAccountId,
              },
            },
            metadata: { video_id: videoData.id, purpose: input.purpose || "" },
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: videoData.title },
                  unit_amount: +videoData.price * 100,
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            ui_mode: "embedded",

            return_url: `https://${host}/payment-status?session_id={CHECKOUT_SESSION_ID}`,
          });

          await ctx.db.insert(licenseTable).values({
            video_id: input.videoId,
            license_type: "instant",
            purpose: input.purpose,
            requester_name: input.fullName,
            stripe_session_checkout_id: checkoutSession.id,
            payment_status: "in discussion",
            user_email: ctx.auth.properties.email,
          });

          return {
            client_secret: checkoutSession.client_secret,
            session_id: checkoutSession.id,
          };
        }

        // Custom license request path
        const [createdLicense] = await ctx.db
          .insert(licenseTable)
          .values({
            video_id: input.videoId,
            user_email: ctx.auth.properties.email,
            license_type: "custom",
            usage: input.usage,
            region: input.region,
            platforms: input.platforms,
            duration: input.duration,
            budget: input.budget,
            purpose: input.purpose,
            requester_name: input.fullName,
            quote_price: input.quotePrice,
          })
          .returning({ id: licenseTable.id })
          .execute();

        return { id: createdLicense.id };
      }),
    ),

  createSettlePriceCheckoutSession: protectedDBProcedure
    .input(object({ licenseId: buildStringSchema("License Id") }))
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [licenseJoin] = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(videoTable, eq(videoTable.id, licenseTable.video_id))
          .where(eq(licenseTable.id, input.licenseId))
          .limit(1)
          .execute();

        const license = licenseJoin?.vididpro_license;
        const video = licenseJoin?.vididpro_video;
        if (!license || !video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "License not found",
          });
        }
        if (license.user_email !== ctx.auth.properties.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not your license",
          });
        }
        if (license.license_type !== "custom") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only custom licenses support settled checkout",
          });
        }
        if (!license.settle_price) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No settled price set for this license",
          });
        }
        if (license.payment_status === "paid") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This license is already paid",
          });
        }

        const headerMap = await headers();
        const host = headerMap.get("host");

        const integration = await getStripeIntegrationByEmail(
          ctx.db,
          video.user_email,
        );
        if (!integration.active) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The uploader has disabled payments.",
          });
        }
        const destinationAccountId = (
          integration.metadata as { account_id?: string } | undefined
        )?.account_id;
        if (!destinationAccountId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The uploader has disabled payments.",
          });
        }

        const unitAmount = Math.round(+license.settle_price * 100);
        const applicationFee = Math.round(+license.settle_price * 100 * 0.5);

        const checkoutSession = await stripe.checkout.sessions.create({
          payment_intent_data: {
            application_fee_amount: applicationFee,
            transfer_data: { destination: destinationAccountId },
          },
          metadata: { license_id: license.id, video_id: video.id },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: { name: `${video.title} — Custom License` },
                unit_amount: unitAmount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          ui_mode: "embedded",
          return_url: `https://${host}/payment-status?session_id={CHECKOUT_SESSION_ID}`,
        });

        await ctx.db
          .update(licenseTable)
          .set({ stripe_session_checkout_id: checkoutSession.id })
          .where(eq(licenseTable.id, license.id))
          .execute();

        return {
          client_secret: checkoutSession.client_secret,
          session_id: checkoutSession.id,
        };
      }),
    ),

  getStripeCheckoutSession: protectedDBProcedure
    .input(object({ session_id: buildStringSchema("Session ID") }))
    .mutation(
      async ({ ctx, input }) =>
        await pipeThroughTRPCErrorHandler(async () => {
          const checkoutSessionDetails =
            await stripe.checkout.sessions.retrieve(input.session_id);

          const videoId = checkoutSessionDetails.metadata?.video_id;

          if (!videoId) {
            return {
              payment_status: "unpaid",
            };
          }

          const isPaid =
            checkoutSessionDetails.payment_status === "paid" ||
            checkoutSessionDetails.payment_status === "no_payment_required";

          const paymentStatus = isPaid ? "paid" : "failed";
          const paymentTime = new Date(
            checkoutSessionDetails.created * 1000,
          ).toISOString();
          const amountTotalCents = checkoutSessionDetails.amount_total!; // integer cents
          const amountPaid = amountTotalCents / 100; // for response only

          await ctx.db
            .update(licenseTable)
            .set({
              stripe_payment_intent_id:
                checkoutSessionDetails.payment_intent?.toString(),
              payment_status: paymentStatus,
              // TODO: Custom license must have a price.
              // price: amountPaid.toString(),
            })
            .where(eq(licenseTable.video_id, videoId))
            .execute();

          return {
            total_paid: amountPaid,
            payment_status: paymentStatus,
            payment_time: paymentTime,
            payment_mode: checkoutSessionDetails.mode,
            currency: checkoutSessionDetails.currency,
          };
        }),
    ),

  getDownloadUrlForLicense: protectedDBProcedure
    .input(object({ licenseId: buildStringSchema("License Id") }))
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [licenseJoin] = await ctx.db
          .select()
          .from(licenseTable)
          .leftJoin(videoTable, eq(videoTable.id, licenseTable.video_id))
          .where(eq(licenseTable.id, input.licenseId))
          .limit(1)
          .execute();

        const license = licenseJoin?.vididpro_license;
        const video = licenseJoin?.vididpro_video;

        if (!license || !video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "License not found",
          });
        }

        if (license.user_email !== ctx.auth.properties.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not your license",
          });
        }

        if (license.payment_status !== "paid") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "License is not paid",
          });
        }

        // Prefer original file for download; fallback to m3u8 if original is missing
        const fileKey = video.original_key || video.m3u8_key;
        if (!fileKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No downloadable file found",
          });
        }

        const directUrl = await getOriginalUrl(fileKey);
        return { url: directUrl };
      }),
    ),
});
