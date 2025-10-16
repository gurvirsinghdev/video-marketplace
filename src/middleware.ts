import { NextRequest, NextResponse } from "next/server";

import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    headers: requestHeaders,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
