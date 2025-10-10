import { NextResponse } from "next/server";
import { getAuth } from "@/auth/actions";

export async function GET() {
  const auth = await getAuth();
  return NextResponse.json(
    auth?.properties.email ? { email: auth.properties.email } : null,
  );
}
