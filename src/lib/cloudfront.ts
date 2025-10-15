import { Resource } from "sst";

export function getCloudfrontUrl(file_key: string) {
  return new URL(file_key, `${Resource.Cdn.url}`).toString();
}
