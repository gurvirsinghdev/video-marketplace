import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { array, enum_, number, object, string } from "valibot";
import { buildPriceSchema, buildStringSchema } from "@/lib/utils";
import {
  createTRPCRouter,
  protectedDBProcedure,
  protectedProcedure,
} from "../init";
import { tagTable, videoTable, videoTagTable } from "@/db/schemas/app.schema";

import { Resource } from "sst";
import { getCloudfrontUrl } from "@/lib/cloudfront";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { pipeThroughTRPCErrorHandler } from "./_app";

const s3Client = new S3Client();
const pageSize = 5;

export const videoRouter = createTRPCRouter({
  generatePresignedUrl: protectedProcedure.query(
    async () =>
      await pipeThroughTRPCErrorHandler(async () => {
        const key = crypto.randomUUID();
        const command = new PutObjectCommand({
          Key: "original/" + key,
          Bucket: Resource.S3.name,
        });
        const url = await getS3SignedUrl(s3Client, command, {
          expiresIn: 300,
        });

        return {
          url,
          fileKey: key,
        };
      }),
  ),

  createNewVideo: protectedDBProcedure
    .input(
      object({
        title: buildStringSchema("Title"),
        description: buildStringSchema("Description"),
        price: buildPriceSchema(),
        status: enum_({ draft: "draft" }),
        tags: array(string()),
        fileKey: buildStringSchema("fileKey"),
      }),
    )
    .mutation(
      async ({ ctx, input }) =>
        await pipeThroughTRPCErrorHandler(async () => {
          await ctx.db.transaction(async (tx) => {
            const [{ id: video_id }] = await tx
              .insert(videoTable)
              .values({
                description: input.description,
                original_key: input.fileKey,
                price: input.price,
                title: input.title,
                user_email: ctx.auth.properties.email,
                status: input.status,
              })
              .returning({ id: videoTable.id })
              .execute();

            input.tags.map(async (tag) => {
              await tx.insert(videoTagTable).values({
                video_id,
                tag_id: tag,
              });
              await tx
                .update(tagTable)
                .set({
                  tag_usage_count: sql`tag_usage_count + 1`,
                  updated_at: new Date(),
                })
                .where(eq(tagTable.id, tag))
                .execute();
            });
          });
        }),
    ),

  listMyVideosPaginated: protectedDBProcedure
    .input(object({ page: number() }))
    .query(
      async ({ ctx, input }) =>
        await pipeThroughTRPCErrorHandler(async () => {
          const [{ count }] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(videoTable)
            .execute();

          const offset = (input.page - 1) * pageSize;
          const records = await ctx.db
            .select({
              id: videoTable.id,
              title: videoTable.title,
              description: videoTable.description,
              created_at: videoTable.created_at,
              thumbnail_key: videoTable.thumbnail_key,
              m3u8_key: videoTable.m3u8_key,
              tags: sql<string[]>`array_agg(distinct ${tagTable.label})`.as(
                "tags",
              ),
            })
            .from(videoTagTable)
            .leftJoin(videoTable, eq(videoTagTable.video_id, videoTable.id))
            .leftJoin(tagTable, eq(videoTagTable.tag_id, tagTable.id))
            .where(eq(videoTable.user_email, ctx.auth.properties.email))
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(videoTable.created_at))
            .groupBy(videoTable.id)
            .execute();

          console.log(records);

          return {
            pageSize,
            pages: Math.ceil(count / pageSize),
            records: records
              .filter((record) => record.id)
              .map((record) => ({
                ...record,
                id: record.id!,
                title: record.title!,
                created_at: record.created_at!,
                description: record.description!,
                thumbnail_key: getCloudfrontUrl(record.thumbnail_key),
                m3u8_key: getCloudfrontUrl(record.m3u8_key),
              })),
          };
        }),
    ),
  listTopVideos: protectedDBProcedure.query(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const records = await ctx.db
        .select()
        .from(videoTable)
        .where(
          and(
            isNotNull(videoTable.thumbnail_key),
            isNotNull(videoTable.m3u8_key),
          ),
        )
        .limit(12)
        .execute();

      return records.map((record) => ({
        ...record,
        thumbnail_key: getCloudfrontUrl(record.thumbnail_key),
        m3u8_key: getCloudfrontUrl(record.m3u8_key),
      }));
    }),
  ),
  listPublishedVideos: protectedDBProcedure.query(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const records = await ctx.db
        .select()
        .from(videoTable)
        .where(
          and(
            isNotNull(videoTable.thumbnail_key),
            isNotNull(videoTable.m3u8_key),
          ),
        )
        .execute();

      return records.map((record) => ({
        ...record,
        thumbnail_key: getCloudfrontUrl(record.thumbnail_key),
        m3u8_key: getCloudfrontUrl(record.m3u8_key),
      }));
    }),
  ),
});
