import { client, setOpenAuthCookies } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import { subjects } from "../../../../openauth/subjects";
import { db } from "@/db/drizzle";
import { userTable } from "@/db/schemas/app.schema";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const exchanged = await client.exchange(code!, `${url.origin}/api/authorize`);
  if (exchanged.err) return NextResponse.json(exchanged.err, { status: 400 });

  await setOpenAuthCookies(exchanged.tokens.access, exchanged.tokens.refresh);

  const verified = await client.verify(subjects, exchanged.tokens.access, {
    refresh: exchanged.tokens.refresh,
  });
  if (!verified.err) {
    await db
      .insert(userTable)
      .values({
        email: verified.subject.properties.email,
      })
      .onConflictDoNothing();
  }

  return NextResponse.redirect(`${url.origin}/dashboard`);
}
