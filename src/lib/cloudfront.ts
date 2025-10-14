import { Resource } from "sst";

export function getCloudfrontUrl(
  file_key: string | null,
  prefix_path: string,
  extension: string,
) {
  if (!file_key) {
    return "";
  }
  return new URL(
    file_key + `.${extension}`,
    `${Resource.Cdn.url}${prefix_path}`,
  ).toString();
}
export function getThumbnailUrl(file_key: string | null) {
  return getCloudfrontUrl(file_key, "/thumbnail/", "jpg");
}
export function getM3U8Url(file_key: string) {
  return getCloudfrontUrl(file_key, "/m3u8/", "m3u8");
}
