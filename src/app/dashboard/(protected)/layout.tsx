import { caller } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ProtectedDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const dbUser = await caller.auth.getAuthenticatedUser();
  if (dbUser.account_status !== "fulfilled") {
    redirect("/dashboard/onboarding");
  }

  return props.children;
}
