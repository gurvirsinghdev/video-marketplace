import { Resource } from "sst";
import { createClient } from "@openauthjs/openauth";
import { cookies as getCookies } from "next/headers";

export const client = createClient({
  clientID: "Application",
  issuer: Resource.OpenAuth.url,
});

export const accessCookieName = "access_token";
export const refreshCookieName = "refresh_token";

export const setOpenAuthCookies = async function (
  access: string,
  refresh: string,
) {
  const cookies = await getCookies();
  const cookieMap: Map<string, string> = new Map([
    [accessCookieName, access],
    [refreshCookieName, refresh],
  ]);

  Array.from(cookieMap.entries()).map(([name, value]) => {
    cookies.set({
      name,
      value,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1 * 60 * 60 * 24 * 7,
    });
  });
};
