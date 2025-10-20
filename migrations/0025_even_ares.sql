CREATE TYPE "public"."vididpro_license_payment_status" AS ENUM('paid', 'failed', 'in discussion');--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "payment_status" "vididpro_license_payment_status" DEFAULT 'in discussion' NOT NULL;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "stripe_session_checkout_id" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "stripe_payment_intent_id" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD CONSTRAINT "vididpro_license_stripe_session_checkout_id_unique" UNIQUE("stripe_session_checkout_id");