import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Loader2Icon, LogOutIcon, SettingsIcon } from "lucide-react";
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
import { callTrpcWithFallback, getQueryClient, trpc } from "@/trpc/server";
import { getIssuerUrl, logout } from "@/auth/actions";

import DashboardBreadcrumbs from "../../modules/dashboard/breadcrumbs";
import DashboardUserAvatar from "../../modules/dashboard/user-avatar";
import Link from "next/link";
import SidebarMenu from "../../modules/dashboard/sidebar-menu";
import { Suspense } from "react";
import { redirect } from "next/navigation";

export default async function DashboardLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.auth.getAuthenticatedUser.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider className="w-screen">
        <Sidebar className="broder-r">
          <SidebarHeader className="border-b p-4">
            <Suspense
              fallback={<Loader2Icon className="size-4 h-4 w-4 animate-spin" />}
            >
              <DashboardUserAvatar />
            </Suspense>
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
          <header className="bg-card flex h-16 items-center justify-between border-b px-4 py-8">
            <SidebarTrigger />
            <DashboardBreadcrumbs />
          </header>
          <main className="h-full w-full">{props.children}</main>
        </section>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
