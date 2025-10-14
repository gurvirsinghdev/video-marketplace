import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  buildFileSchema,
  buildPriceSchema,
  buildStringSchema,
} from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, object } from "valibot";

import { Resource } from "sst";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { getThumbnailUrl } from "@/lib/cloudfront";
import path from "path";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { videoTable } from "@/db/schemas/app.schema";

const s3Client = new S3Client();

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

  listMyVideosPaginated: protectedProcedure.query(async ({ ctx }) =>
    pipeThroughTRPCErrorHandler(async () => {
      const records = await db
        .select()
        .from(videoTable)
        .where(eq(videoTable.user_email, ctx.auth.properties.email))
        .execute();

      return records.map(
        ({ original_key, thumbnail_key, m3u8_key, ...record }) => ({
          ...record,
          thumbnail: getThumbnailUrl(original_key),
        }),
      );
    }),
  ),
});
