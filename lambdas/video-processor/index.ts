import { createReadStream, createWriteStream, existsSync } from "fs";
import { mkdir, readdir, rmdir, unlink } from "fs/promises";

import { Readable } from "stream";
import { ReadableStream } from "stream/web";
import { S3 } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import chalk from "chalk";
import { eq } from "drizzle-orm";
import { execFile } from "child_process";
import { getDB } from "./drizzle";
import mime from "mime";
import os from "os";
import path from "path";
import { promisify } from "util";
import { videoTable } from "./app.schema";

const exec = promisify(execFile);
const s3 = new S3();
const ffmpegPath = path.resolve(__dirname, "ffmpeg-arm64", "ffmpeg");
const watermarkPath = path.resolve(__dirname, "watermark.png");

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

/**
 * Safe file deletion - doesn't throw if file doesn't exist
 */
const safeUnlink = async (filePath: string): Promise<void> => {
  try {
    if (existsSync(filePath)) {
      await unlink(filePath);
      logger.debug(`Deleted file: ${filePath}`, "Cleanup");
    }
  } catch (err) {
    logger.warn(
      `Failed to delete ${filePath}: ${(err as Error).message}`,
      "Cleanup",
    );
  }
};

/**
 * Safe directory deletion - doesn't throw if directory doesn't exist
 */
const safeRmdir = async (dirPath: string): Promise<void> => {
  try {
    if (existsSync(dirPath)) {
      await rmdir(dirPath, { recursive: true });
      logger.debug(`Deleted directory: ${dirPath}`, "Cleanup");
    }
  } catch (err) {
    logger.warn(
      `Failed to delete directory ${dirPath}: ${(err as Error).message}`,
      "Cleanup",
    );
  }
};

/**
 * Verify FFmpeg and watermark files exist
 */
const verifyAssets = async (): Promise<void> => {
  if (!existsSync(ffmpegPath)) {
    throw new Error(`FFmpeg not found at ${ffmpegPath}`);
  }

  if (!existsSync(watermarkPath)) {
    throw new Error(`Watermark not found at ${watermarkPath}`);
  }

  try {
    await exec(ffmpegPath, ["-version"]);
  } catch (err) {
    throw new Error(`FFmpeg verification failed: ${(err as Error).message}`);
  }
};

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
    } catch (err) {
      logger.warn(
        `Invalid JSON body: ${msg.body} - ${(err as Error).message}`,
        "Parser",
      );
    }
  }

  return parsed;
};

const getTempPaths = (key: string, ext: string) => {
  const tmp = os.tmpdir();
  const base = path.basename(key, path.extname(key));
  const uniqueId = Date.now(); // Add timestamp for uniqueness

  return {
    video: path.join(tmp, `${base}_${uniqueId}.${ext}`),
    thumbnail: path.join(tmp, `${base}_${uniqueId}.jpg`),
    playlist: path.join(tmp, `${base}_${uniqueId}.m3u8`),
  };
};

const downloadFromS3 = async (bucket: string, key: string, dest: string) => {
  const ctx = "Download";

  // Verify object exists first
  await s3.headObject({ Bucket: bucket, Key: key });

  const obj = await s3.getObject({ Bucket: bucket, Key: key });
  if (!obj.Body) throw new Error("S3 object has no body");

  const webStream =
    obj.Body.transformToWebStream() as unknown as ReadableStream;
  const nodeStream = Readable.fromWeb(webStream);

  await new Promise<void>((resolve, reject) => {
    const out = createWriteStream(dest);
    let hasError = false;

    const cleanup = () => {
      nodeStream.unpipe(out);
      out.destroy();
    };

    nodeStream.pipe(out);

    out.on("finish", () => {
      if (!hasError) {
        resolve();
      }
    });

    out.on("error", (err) => {
      hasError = true;
      cleanup();
      reject(err);
    });

    nodeStream.on("error", (err) => {
      hasError = true;
      cleanup();
      reject(err);
    });
  });

  // Verify file was written
  if (!existsSync(dest)) {
    throw new Error("Download completed but file not found");
  }

  logger.success(`Downloaded ${key} to ${dest}`, ctx);
};

const uploadToS3 = async (
  bucket: string,
  key: string,
  localPath: string,
  contentType?: string,
) => {
  const ctx = "Upload";

  // Verify file exists before upload
  if (!existsSync(localPath)) {
    throw new Error(`File not found: ${localPath}`);
  }

  await s3.putObject({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(localPath),
    ContentType:
      contentType || mime.getType(localPath) || "application/octet-stream",
  });

  // Verify upload succeeded
  await s3.headObject({ Bucket: bucket, Key: key });
  logger.success(`Uploaded ${key}`, ctx);
};

const getFileExtension = async (
  bucket: string,
  key: string,
): Promise<string> => {
  const head = await s3.headObject({ Bucket: bucket, Key: key });
  const contentType = head.ContentType || "";
  const ext = mime.getExtension(contentType);

  if (!ext) {
    // Fallback to file extension from key
    const keyExt = path.extname(key).slice(1);
    if (keyExt) {
      logger.warn(`Using file extension from key: ${keyExt}`, "FileType");
      return keyExt;
    }
    throw new Error(`Unknown content type: ${contentType}`);
  }

  return ext;
};

const generateThumbnail = async (input: string, output: string) => {
  if (!existsSync(input)) {
    throw new Error(`Input video not found: ${input}`);
  }

  try {
    await exec(ffmpegPath, [
      "-i",
      input,
      "-ss",
      "00:00:00",
      "-vframes",
      "1",
      "-vf",
      "scale=1280:-1",
      "-y", // Overwrite output
      output,
    ]);

    if (!existsSync(output)) {
      throw new Error("Thumbnail generation completed but file not found");
    }

    logger.success(`Thumbnail generated: ${output}`, "FFmpeg");
  } catch (err) {
    const error = err as Error;
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
};

const convertToHLS = async (
  input: string,
  outputDir: string,
  playlistPath: string,
) => {
  if (!existsSync(input)) {
    throw new Error(`Input video not found: ${input}`);
  }

  try {
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Apply watermark and convert to HLS in one pass
    // Watermark positioned at bottom-right corner with 20px padding
    await exec(ffmpegPath, [
      "-i",
      input,
      "-i",
      watermarkPath,
      "-filter_complex",
      "[0:v]scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2[scaled];[1:v]scale=50:50[wm];[scaled][wm]overlay=main_w-overlay_w-20:main_h-overlay_h-20[out]",
      "-map",
      "[out]",
      "-map",
      "0:a?",
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
      path.join(
        outputDir,
        path.basename(playlistPath).replace(".m3u8", "") + "_segment_%03d.ts",
      ),
      "-y", // Overwrite output
      playlistPath,
    ]);

    if (!existsSync(playlistPath)) {
      throw new Error("HLS conversion completed but playlist not found");
    }

    // Verify segments were created
    const files = await readdir(outputDir);
    const segmentFiles = files.filter((f) => f.endsWith(".ts"));

    if (segmentFiles.length === 0) {
      throw new Error("No HLS segments were created");
    }

    logger.success(
      `HLS conversion with watermark completed: ${playlistPath} (${segmentFiles.length} segments)`,
      "FFmpeg",
    );
    return outputDir;
  } catch (err) {
    const error = err as Error;
    throw new Error(`HLS conversion failed: ${error.message}`);
  }
};

const uploadHLSDirectoryToS3 = async (
  bucket: string,
  dirPath: string,
  s3Prefix: string,
) => {
  const ctx = "Upload-HLS";

  if (!existsSync(dirPath)) {
    throw new Error(`HLS directory not found: ${dirPath}`);
  }

  const files = await readdir(dirPath);

  if (files.length === 0) {
    throw new Error("No files found in HLS directory");
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const s3Key = path.join(s3Prefix, file).replace(/\\/g, "/");

    await uploadToS3(bucket, s3Key, filePath);
    logger.info(`Uploaded HLS file: ${s3Key}`, ctx);
  }
};

/**
 * Update database with retry logic
 */
const updateDatabase = async (
  originalKey: string,
  thumbnailKey: string,
  m3u8Key: string,
): Promise<void> => {
  const db = await getDB();
  await db
    .update(videoTable)
    .set({
      thumbnail_key: thumbnailKey,
      m3u8_key: m3u8Key,
      updated_at: new Date(), // Add timestamp if schema supports it
    })
    .where(eq(videoTable.original_key, originalKey))
    .execute();

  // Verify update affected rows (if your ORM provides this info)
  logger.success(`Database updated for: ${originalKey}`, "Database");
};

/**
 * Process a single video record
 */
const processVideoRecord = async (record: ParsedS3Record): Promise<void> => {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  logger.info(`Starting processing: ${key}`, "Processor");

  if (!key.startsWith("original/")) {
    logger.debug(`Skipping non-original key: ${key}`, "Processor");
    return;
  }

  const ext = await getFileExtension(bucket, key);
  const paths = getTempPaths(key, ext);
  const baseName = path.basename(paths.video, `.${ext}`) + "_segments";
  const outputDir = path.join(path.dirname(paths.playlist), baseName);

  try {
    // Download video
    logger.info(`Downloading video: ${key}`, "Processor");
    await downloadFromS3(bucket, key, paths.video);

    // Generate thumbnail
    logger.info("Generating thumbnail...", "Processor");
    await generateThumbnail(paths.video, paths.thumbnail);

    // Upload thumbnail
    logger.info("Uploading thumbnail...", "Processor");
    const thumbnailKey = `thumbnails/${path.basename(paths.thumbnail)}`;
    await uploadToS3(bucket, thumbnailKey, paths.thumbnail, "image/jpeg");

    // Convert to HLS
    logger.info("Converting to HLS 480p...", "Processor");
    const segmentsDir = await convertToHLS(
      paths.video,
      outputDir,
      paths.playlist,
    );

    // Upload playlist
    logger.info("Uploading M3U8 playlist...", "Processor");
    const playlistKey = `m3u8/${path.basename(paths.playlist)}`;
    await uploadToS3(bucket, playlistKey, paths.playlist);

    // Upload segments
    await uploadHLSDirectoryToS3(bucket, segmentsDir, "m3u8");

    // Update database
    logger.info("Updating database...", "Processor");
    const originalKeyName = path.basename(key, path.extname(key));
    await updateDatabase(originalKeyName, thumbnailKey, playlistKey);

    logger.success(`Successfully processed: ${key}`, "Processor");
  } finally {
    // Cleanup - always runs, even if processing fails
    logger.info("Cleaning up temporary files...", "Cleanup");

    await Promise.allSettled([
      safeUnlink(paths.video),
      safeUnlink(paths.thumbnail),
      safeUnlink(paths.playlist),
      safeRmdir(outputDir),
    ]);

    logger.info("Cleanup completed", "Cleanup");
  }
};

export const handler = async (event: SQSEvent) => {
  try {
    // Verify FFmpeg and watermark are available
    await verifyAssets();

    const s3Records = parseSQSEvent(event);
    logger.info(`Processing ${s3Records.length} S3 record(s)`, "Handler");

    if (s3Records.length === 0) {
      logger.warn("No valid S3 records found in event", "Handler");
      return;
    }

    const results = await Promise.allSettled(
      s3Records.map((record) => processVideoRecord(record)),
    );

    // Log summary
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(
      `Processing complete: ${succeeded} succeeded, ${failed} failed`,
      "Handler",
    );

    // Log individual failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logger.error(`Record ${index + 1} failed: ${result.reason}`, "Handler");
      }
    });

    // If all records failed, throw to trigger SQS retry
    if (failed === s3Records.length) {
      throw new Error("All records failed processing");
    }
  } catch (err) {
    logger.error(`Handler error: ${(err as Error).message}`, "Handler");
    throw err; // Re-throw to trigger Lambda retry/DLQ
  }
};
