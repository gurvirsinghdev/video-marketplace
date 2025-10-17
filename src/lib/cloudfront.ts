import { Resource } from "sst";

export function getCloudfrontUrl(file_key: string | undefined | null) {
  return new URL(file_key || "/null", `${Resource.Cdn.url}`).toString();
}
