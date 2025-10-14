ALTER TABLE "vididpro_video" RENAME COLUMN "file_key" TO "original_key";--> statement-breakpoint
ALTER TABLE "vididpro_video" ADD COLUMN "thumbnail_key" varchar;--> statement-breakpoint
ALTER TABLE "vididpro_video" ADD COLUMN "m3u8_key" varchar;