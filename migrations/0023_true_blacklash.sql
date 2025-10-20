ALTER TABLE "vididpro_license" DROP CONSTRAINT "vididpro_license_license_key_unique";--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "usage" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "region" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "platforms" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "duration" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" ADD COLUMN "budget" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_license" DROP COLUMN "license_key";