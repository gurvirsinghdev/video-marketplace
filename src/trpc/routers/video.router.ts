import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { buildPriceSchema, buildStringSchema } from "@/lib/utils";
import { createTRPCRouter, protectedProcedure } from "../init";
import { enum_, object } from "valibot";

import { Resource } from "sst";
import { db } from "@/db/drizzle";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { pipeThroughTRPCErrorHandler } from "./_app";
import { videoTable } from "@/db/schemas/app.schema";

const s3Client = new S3Client();

export const videoRouter = createTRPCRouter({
  generatePresignedUrl: protectedProcedure.query(async () =>
    pipeThroughTRPCErrorHandler(async () => {
      const key = crypto.randomUUID();
      const command = new PutObjectCommand({
        Key: key,
        Bucket: Resource.VididProObjectStorage.name,
      });
      const url = await getSignedUrl(s3Client, command, {
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
            file_key: input.fileKey,
            price: input.price,
            title: input.title,
            user_email: ctx.auth.properties.email,
            status: input.status,
            tags: input.tags,
          })
          .execute();
      }),
    ),
});
