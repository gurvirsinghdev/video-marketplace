import {
  accessCookieName,
  client,
  refreshCookieName,
  setOpenAuthCookies,
} from ".";
import { cookies as getCookies, headers as getHeaders } from "next/headers";
import { object, string } from "valibot";

import { createSubjects } from "@openauthjs/openauth";
import { redirect } from "next/navigation";

const subjects = createSubjects({
  user: object({
    email: string(),
  }),
});

const getOpenAuthCookies = async function () {
  const cookies = await getCookies();
  return [accessCookieName, refreshCookieName]
    .map((cookieName) => ({
      [cookieName]: cookies.get(cookieName) ?? null,
    }))
    .reduce(
      (acc, cookieObject) => ({ ...acc, ...cookieObject }),
      {} as Record<
        typeof accessCookieName | typeof refreshCookieName,
        ReturnType<Awaited<ReturnType<typeof getCookies>>["get"]> | null
      >,
    );
};

export async function getAuth() {
  const { access_token, refresh_token } = await getOpenAuthCookies();
  if (!access_token) {
    return null;
  }

  const verified = await client.verify(subjects, access_token.value, {
    refresh: refresh_token?.value,
  });
  if (verified.err) {
    return null;
  }

  if (verified.tokens) {
    await setOpenAuthCookies(verified.tokens.access, verified.tokens.refresh);
  }
  return verified.subject;
}

export async function getIssuerUrl() {
  const headers = await getHeaders();
  const host = headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const { url } = await client.authorize(
    `${protocol}://${host}/api/callback`,
    "code",
  );
  return url;
}

export async function requireAuthorization(config: {
  redirectIfUnAuthorized: boolean;
}) {
  const { access_token, refresh_token } = await getOpenAuthCookies();
  if (access_token) {
    const verified = await client.verify(subjects, access_token.value, {
      refresh: refresh_token?.value,
    });
    if (!verified.err) {
      if (verified.tokens) {
        await setOpenAuthCookies(
          verified.tokens.access,
          verified.tokens.refresh,
        );
      }
      return true;
    }
  }

  if (config.redirectIfUnAuthorized) {
    redirect(await getIssuerUrl());
  }
  return false;
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete(accessCookieName);
  cookies.delete(refreshCookieName);

  redirect("/");
}
