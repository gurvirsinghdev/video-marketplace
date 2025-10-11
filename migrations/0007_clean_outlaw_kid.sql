CREATE TYPE "public"."integration_service" AS ENUM('stripe');--> statement-breakpoint
CREATE TABLE "vididpro_integration" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar NOT NULL,
	"service" "integration_service",
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "vididpro_integration_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
ALTER TABLE "vididpro_user" DROP COLUMN "stripe_account_id";