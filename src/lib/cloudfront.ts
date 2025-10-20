import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

const s3 = new S3();

export function getCloudfrontUrl(file_key: string | undefined | null) {
  return new URL(file_key || "/null", `${Resource.Cdn.url}`).toString();
}

export async function getOriginalUrl(file_key: string) {
  const params = {
    Bucket: Resource.S3.name,
    Key: `original/${file_key}`,
  };

  return await getSignedUrl(s3, new GetObjectCommand(params));
}
