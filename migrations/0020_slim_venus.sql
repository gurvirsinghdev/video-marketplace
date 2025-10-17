CREATE TABLE "vididpro_tag" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"description" varchar NOT NULL,
	"tag_usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "vididpro_tag_id_pk" PRIMARY KEY("id"),
	CONSTRAINT "vididpro_tag_label_unique" UNIQUE("label"),
	CONSTRAINT "vididpro_tag_slug_unique" UNIQUE("slug")
);
