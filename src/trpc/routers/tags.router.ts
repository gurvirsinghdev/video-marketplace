import { $Type, and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { baseProcedureWithDB, createTRPCRouter } from "../init";
import { tagTable, videoTable, videoTagTable } from "@/db/schemas/app.schema";

import { getCloudfrontUrl } from "@/lib/cloudfront";
import { pipeThroughTRPCErrorHandler } from "./_app";

export const tagsRouter = createTRPCRouter({
  getAllTags: baseProcedureWithDB.query(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const tags = await ctx.db
          .select()
          .from(tagTable)
          .orderBy(asc(tagTable.label))
          .execute();
        return tags;
      }),
  ),
  getTopTags: baseProcedureWithDB.query(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const tags = await ctx.db
          .select()
          .from(tagTable)
          .limit(10)
          .orderBy(desc(tagTable.tag_usage_count), desc(tagTable.created_at))
          .execute();
        return tags;
      }),
  ),
  getTopTagsWithVideos: baseProcedureWithDB.query(
    async ({ ctx }) =>
      await pipeThroughTRPCErrorHandler(async () => {
        const tags = await ctx.db
          .select({
            id: tagTable.id,
            slug: tagTable.slug,
            label: tagTable.label,
            tag_usage_count: tagTable.tag_usage_count,
            created_at: tagTable.created_at,
          })
          .from(videoTagTable)
          .leftJoin(tagTable, eq(videoTagTable.tag_id, tagTable.id))
          .leftJoin(videoTable, eq(videoTagTable.video_id, videoTable.id))
          .groupBy(
            tagTable.id,
            tagTable.slug,
            tagTable.label,
            tagTable.tag_usage_count,
            tagTable.created_at,
          )
          .orderBy(desc(tagTable.tag_usage_count), desc(tagTable.created_at))
          .limit(10)
          .execute();

        // Step 2: Attach videos to each tag
        const tagsWithVideos = await Promise.all(
          tags.map(async (tag) => {
            const videos = await ctx.db
              .select({
                id: videoTable.id,
                title: videoTable.title,
                price: videoTable.price,
                m3u8_key: videoTable.m3u8_key,
                created_at: videoTable.created_at,
                description: videoTable.description,
                thumbnail_key: videoTable.thumbnail_key,
              })
              .from(videoTable)
              .leftJoin(
                videoTagTable,
                eq(videoTable.id, videoTagTable.video_id),
              )
              .where(
                and(
                  eq(videoTagTable.tag_id, tag.id!),
                  isNotNull(videoTable.thumbnail_key),
                ),
              )
              .execute();

            return {
              ...tag,
              videos: videos.map((video) => ({
                ...video,
                m3u8_key: getCloudfrontUrl(video.m3u8_key),
                thumbnail_key: getCloudfrontUrl(video.thumbnail_key),
                tags,
              })),
            };
          }),
        );

        return tagsWithVideos;
      }),
  ),
});
