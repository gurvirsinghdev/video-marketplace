CREATE TYPE "public"."video_status_enum" AS ENUM('draft', 'restricted', 'published');--> statement-breakpoint
CREATE TABLE "vididpro_video" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"file_key" varchar NOT NULL,
	"status" "video_status_enum" DEFAULT 'draft' NOT NULL,
	"tags" varchar,
	"price_in_cents" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "vididpro_video_id_pk" PRIMARY KEY("id")
);
