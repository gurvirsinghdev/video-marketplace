import { LogOutIcon, SettingsIcon } from "lucide-react";
import {
  SidebarMenu as ShadcnSidebarMenu,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { callTrpcWithFallback, trpc } from "@/trpc/server";
import { getIssuerUrl, logout } from "@/auth/actions";

import DashboardBreadcrumbs from "../../modules/dashboard/breadcrumbs";
import DashboardUserAvatar from "../../modules/dashboard/user-avatar";
import Link from "next/link";
import SidebarMenu from "../../modules/dashboard/sidebar-menu";
import { redirect } from "next/navigation";

export default async function DashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const dbUser = await callTrpcWithFallback(() =>
    trpc.auth.getAuthenticatedUser(),
  );
  if (!dbUser) {
    redirect(await getIssuerUrl());
  }

  return (
    <SidebarProvider className="w-screen">
      <Sidebar className="broder-r">
        <SidebarHeader className="border-b p-4">
          <DashboardUserAvatar
            displayName={dbUser.name ?? dbUser.email.split("@")[0]}
          />
        </SidebarHeader>
        <SidebarContent className="gap-0">
          <SidebarMenu />
        </SidebarContent>
        <SidebarFooter className="border-t">
          <ShadcnSidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  href={"/dashboard/settings"}
                  className="flex flex-row items-center py-5!"
                >
                  <SettingsIcon className="size-4 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tabIndex={-1}
                className="hover:bg-destructive/60! cursor-pointer py-5!"
                onClick={logout}
              >
                <LogOutIcon className="size-4 h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </ShadcnSidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Dashboard Content */}
      <section className="flex min-h-screen w-full max-w-screen flex-col">
        <header className="bg-card mt-[0.75px] flex h-16 items-center justify-between border-b px-4">
          <SidebarTrigger />
          <DashboardBreadcrumbs />
        </header>
        <main>{props.children}</main>
      </section>
    </SidebarProvider>
  );
}
