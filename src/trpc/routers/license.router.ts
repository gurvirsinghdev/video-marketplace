import { email, enum_, object, optional, pipe, string } from "valibot";
import { createTRPCRouter, protectedDBProcedure } from "../init";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { licenseTable, videoTable } from "@/db/schemas/app.schema";
import { buildStringSchema } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { Resource } from "sst";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

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
});
export const licenseRouter = createTRPCRouter({
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
          // Create Stripe session and an instant license row
          const checkoutSession = await stripe.checkout.sessions.create({
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
            return_url: `https://${host}/payments?session_id={CHECKOUT_SESSION_ID}`,
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
          })
          .returning({ id: licenseTable.id })
          .execute();

        return { id: createdLicense.id };
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
          const amountPaid = +checkoutSessionDetails.amount_total! / 100;

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

  // Removed old submitCustomLicenseRequest (replaced by createLicenseRequest)
});
