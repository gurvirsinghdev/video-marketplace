import { caller } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const dbUser = await caller.auth.getAuthenticatedUser();
  if (dbUser?.account_status !== "fulfilled") {
    if ((await headers()).get("x-pathname") !== "/dashboard/onboarding") {
      redirect("/dashboard/onboarding");
    }
  }

  return props.children;
}
