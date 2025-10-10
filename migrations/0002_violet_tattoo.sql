CREATE TYPE "public"."user_account_status" AS ENUM('pending', 'fulfilled');--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'vididpro_user'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "vididpro_user" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD CONSTRAINT "vididpro_user_email_pk" PRIMARY KEY("email");--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "name" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "account_status" "user_account_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "vididpro_user" ADD COLUMN "updated_at" timestamp;