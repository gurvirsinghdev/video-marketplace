CREATE TYPE "public"."vididpro_license_type" AS ENUM('instant', 'custom');--> statement-breakpoint
CREATE TABLE "vididpro_license" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_email" varchar NOT NULL,
	"video_id" uuid NOT NULL,
	"license_key" varchar NOT NULL,
	"license_type" "vididpro_license_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "vididpro_license_license_key_unique" UNIQUE("license_key")
);
