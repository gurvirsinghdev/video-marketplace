import { createReadStream, createWriteStream } from "fs";
import { mkdir, readdir, rmdir, unlink } from "fs/promises";

import { Readable } from "stream";
import { ReadableStream } from "stream/web";
import { S3 } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import chalk from "chalk";
import { db } from "./drizzle";
import { eq } from "drizzle-orm";
import { execFile } from "child_process";
import mime from "mime";
import os from "os";
import path from "path";
import { promisify } from "util";
import { videoTable } from "./app.schema";

const exec = promisify(execFile);
const s3 = new S3();
const ffmpegPath = path.resolve(__dirname, "ffmpeg");

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface LogOptions {
  context?: string;
}

const log = (level: LogLevel, message: string, options?: LogOptions) => {
  const time = new Date().toISOString();
  const prefix = options?.context ? `[${options.context}]` : "";

  const color =
    level === "info"
      ? chalk.cyan
      : level === "warn"
        ? chalk.yellow
        : level === "error"
          ? chalk.red
          : level === "success"
            ? chalk.green
            : chalk.magenta;

  console.log(color(`${time} ${prefix} ${message}`));
};

const logger = {
  info: (msg: string, ctx?: string) => log("info", msg, { context: ctx }),
  warn: (msg: string, ctx?: string) => log("warn", msg, { context: ctx }),
  error: (msg: string, ctx?: string) => log("error", msg, { context: ctx }),
  success: (msg: string, ctx?: string) => log("success", msg, { context: ctx }),
  debug: (msg: string, ctx?: string) => log("debug", msg, { context: ctx }),
};

interface SQSEvent {
  Records: {
    messageId: string;
    receiptHandle: string;
    body: string;
  }[];
}

type ParsedS3Record = S3Event["Records"][number];

const parseSQSEvent = (event: SQSEvent): ParsedS3Record[] => {
  const parsed: ParsedS3Record[] = [];

  for (const msg of event.Records) {
    try {
      const body = JSON.parse(msg.body);
      if (body.Records && Array.isArray(body.Records)) {
        parsed.push(...body.Records);
      } else {
        logger.warn(`Invalid S3 event in message: ${msg.body}`, "Parser");
      }
    } catch {
      logger.warn(`Invalid JSON body: ${msg.body}`, "Parser");
    }
  }

  return parsed;
};

const getTempPaths = (key: string, ext: string) => {
  const tmp = os.tmpdir();
  const base = path.basename(key, path.extname(key));
  return {
    video: path.join(tmp, `${base}.${ext}`),
    thumbnail: path.join(tmp, `${base}.jpg`),
    playlist: path.join(tmp, `${base}.m3u8`),
  };
};

const downloadFromS3 = async (bucket: string, key: string, dest: string) => {
  const ctx = "Download";
  const obj = await s3.getObject({ Bucket: bucket, Key: key });
  if (!obj.Body) throw new Error("S3 object has no body");

  const webStream =
    obj.Body.transformToWebStream() as unknown as ReadableStream;
  const nodeStream = Readable.fromWeb(webStream);

  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(dest);
    nodeStream.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
    nodeStream.on("error", reject);
  });

  logger.success(`Downloaded ${key} to ${dest}`, ctx);
};

const uploadToS3 = async (
  bucket: string,
  key: string,
  localPath: string,
  contentType?: string,
) => {
  const ctx = "Upload";
  await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(localPath),
    ContentType:
      contentType || mime.getType(localPath) || "application/octet-stream",
  });

  logger.success(`Uploaded ${key}`, ctx);
};

const getFileExtension = async (
  bucket: string,
  key: string,
): Promise<string> => {
  const head = await s3.headObject({ Bucket: bucket, Key: key });
  const ext = mime.getExtension(head.ContentType || "");
  if (!ext) throw new Error("Unknown content type");
  return ext;
};

const generateThumbnail = async (input: string, output: string) => {
  await exec(
    ffmpegPath,
    `-i ${input} -ss 00:00:02 -vframes 1 -vf scale=320:-1 ${output}`.split(" "),
  );
  logger.success(`Thumbnail generated: ${output}`, "FFmpeg");
};

const convertToHLS = async (
  input: string,
  outputDir: string,
  playlistPath: string,
) => {
  await mkdir(outputDir);
  await exec(ffmpegPath, [
    "-i",
    input,
    "-vf",
    "scale=iw:480",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "fast",
    "-f",
    "hls",
    "-hls_time",
    "10",
    "-hls_list_size",
    "0",
    "-hls_segment_filename",
    path.join(outputDir, path.basename(playlistPath) + "_segment_%03d.ts"),
    playlistPath,
  ]);

  logger.success(`HLS conversion completed: ${playlistPath}`, "FFmpeg");
  return outputDir;
};

const uploadHLSDirectoryToS3 = async (
  bucket: string,
  dirPath: string,
  s3Prefix: string,
) => {
  const ctx = "Upload-HLS";
  const files = await readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const s3Key = path.join(s3Prefix, file).replace(/\\/g, "/");

    await uploadToS3(bucket, s3Key, filePath);
    logger.info(`Uploaded HLS file: ${s3Key}`, ctx);
  }
};

export const handler = async (event: SQSEvent) => {
  const s3Records = parseSQSEvent(event);
  logger.info(`Processing ${s3Records.length} S3 record(s)`, "Handler");

  for (const record of s3Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);

    if (!key.startsWith("original/")) {
      logger.debug(`Skipping non-original key: ${key}`, "Handler");
      continue;
    }

    const ext = await getFileExtension(bucket, key);
    const paths = getTempPaths(key, ext);

    try {
      logger.info(`Downloading video: ${key}`, "Handler");
      await downloadFromS3(bucket, key, paths.video);

      logger.info("Generating thumbnail...", "Handler");
      await generateThumbnail(paths.video, paths.thumbnail);

      logger.info("Uploading thumbnail...", "Handler");
      const thumbnailKey = `thumbnails/${path.basename(paths.thumbnail)}`;
      await uploadToS3(bucket, thumbnailKey, paths.thumbnail, "image/jpeg");

      logger.info("Converting to HLS 480p...", "Handler");
      const baseName = path.basename(paths.video) + "_segments";
      const outputDir = path.join(path.dirname(paths.playlist), baseName);
      const segmentsDir = await convertToHLS(
        paths.video,
        outputDir,
        paths.playlist,
      );

      logger.info("Uploading M3U8 playlist...", "Handler");
      const playlistKey = `m3u8/${path.basename(paths.playlist)}`;
      await uploadToS3(bucket, playlistKey, paths.playlist);
      await uploadHLSDirectoryToS3(bucket, segmentsDir, "m3u8");

      logger.info("Updating the database...", "Handler");
      db.update(videoTable)
        .set({ thumbnail_key: thumbnailKey, m3u8_key: playlistKey })
        .where(eq(videoTable.original_key, path.parse(key).name))
        .execute();
      logger.success(`Successfully processed: ${key}`, "Handler");
    } catch (err) {
      logger.error(
        `Failed processing ${key}: ${(err as Error).message}`,
        "Handler",
      );
    } finally {
      logger.info("Unlinking local files...", "Hanlder");
      await Promise.all([...Object.values(paths)].map((p) => unlink(p)));
      const baseName = path.basename(paths.video) + "_segments";
      const outputDir = path.join(path.dirname(paths.playlist), baseName);
      await rmdir(outputDir, { recursive: true });
      logger.info("Deleted local files", "Handler");
    }
  }
};
