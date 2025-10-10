ALTER TABLE "user" RENAME TO "vididpro_user";--> statement-breakpoint
ALTER TABLE "vididpro_user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD CONSTRAINT "vididpro_user_email_unique" UNIQUE("email");