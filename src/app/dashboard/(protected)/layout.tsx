import { redirect } from "next/navigation";
import { trpc } from "@/trpc/server";

export default async function ProtectedDashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const dbUser = await trpc.auth.getAuthenticatedUser();
  if (dbUser.account_status !== "fulfilled") {
    redirect("/dashboard/onboarding");
  }

  return props.children;
}
