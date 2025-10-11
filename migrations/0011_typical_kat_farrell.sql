CREATE TYPE "public"."user_account_type" AS ENUM('company', 'government_entity', 'individual', 'non_profit');--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "account_type" "user_account_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "registered_name" varchar;