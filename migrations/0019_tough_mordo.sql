CREATE TABLE "vididpro_video_tag" (
	"tag_id" uuid NOT NULL,
	"video_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vididpro_video" DROP COLUMN "tags";