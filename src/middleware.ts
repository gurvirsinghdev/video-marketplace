import { getAuth, getIssuerUrl, requireAuthorization } from "./auth/actions";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function middleware(req: Request) {
  const auth = await getAuth();

  if (auth?.properties.email) {
    return NextResponse.next();
  }
  return NextResponse.redirect(await getIssuerUrl());
}
