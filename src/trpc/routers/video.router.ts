import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { and, desc, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { buildPriceSchema, buildStringSchema } from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, number, object } from "valibot";

import { Resource } from "sst";
import { db } from "@/db/drizzle";
import { getCloudfrontUrl } from "@/lib/cloudfront";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { videoTable } from "@/db/schemas/app.schema";

const s3Client = new S3Client();
const pageSize = 10;

export const videoRouter = createTRPCRouter({
  generatePresignedUrl: protectedProcedure.query(async () =>
    pipeThroughTRPCErrorHandler(async () => {
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

  createNewVideo: protectedProcedure
    .input(
      object({
        title: buildStringSchema("Title"),
        description: buildStringSchema("Description"),
        price: buildPriceSchema(),
        status: enum_({ draft: "draft" }),
        tags: buildStringSchema("Tags"),
        fileKey: buildStringSchema("fileKey"),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        await db
          .insert(videoTable)
          .values({
            description: input.description,
            original_key: input.fileKey,
            price: input.price,
            title: input.title,
            user_email: ctx.auth.properties.email,
            status: input.status,
            tags: input.tags,
          })
          .execute();
      }),
    ),

  listMyVideosPaginated: protectedProcedure
    .input(object({ page: number() }))
    .query(async ({ ctx, input }) =>
      pipeThroughTRPCErrorHandler(async () => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(videoTable)
          .execute();

        const offset = (input.page - 1) * pageSize;
        const records = await db
          .select()
          .from(videoTable)
          .where(eq(videoTable.user_email, ctx.auth.properties.email))
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(videoTable.created_at))
          .execute();

        return {
          pageSize,
          pages: Math.ceil(count / pageSize),
          records: records.map(
            ({ original_key, thumbnail_key, m3u8_key, ...record }) => ({
              ...record,
              thumbnail_key: getCloudfrontUrl(thumbnail_key!),
              m3u8_key: getCloudfrontUrl(m3u8_key!),
            }),
          ),
        };
      }),
    ),
});
