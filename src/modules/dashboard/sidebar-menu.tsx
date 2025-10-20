"use client";

import {
  BadgeCheckIcon,
  BanknoteIcon,
  CurrencyIcon,
  DollarSignIcon,
  FileCheckIcon,
  FilmIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  LucideIcon,
  ReceiptIcon,
  WalletCards,
} from "lucide-react";
import {
  SidebarMenu as ShadcnSidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface SidebarMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
interface SidebarGroupItem {
  label: string;
  items: SidebarMenuItem[];
}

const sidebarGroupItems: SidebarGroupItem[] = [
  {
    label: "navigation",
    items: [
      {
        label: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
      },
      {
        label: "license requests",
        href: "/dashboard/licenses",
        icon: BadgeCheckIcon,
      },
    ],
  },
  {
    label: "content",
    items: [
      {
        label: "videos",
        href: "/dashboard/videos",
        icon: FilmIcon,
      },
      {
        label: "purchased videos",
        href: "/dashboard/purchased-videos",
        icon: FileCheckIcon,
      },
    ],
  },
  {
    label: "Billing",
    items: [
      {
        label: "Transactions",
        href: "/",
        icon: ReceiptIcon,
      },
    ],
  },
];

export default function SidebarMenu() {
  const pathname = usePathname();
  const trpc = useTRPC();

  const getStripeLoginLinkMutation = useMutation(
    trpc.user.getStripeDashboardLoginLink.mutationOptions({
      onMutate() {
        toast.loading("Opening Stripe Dashboard...", { id: "stripe-login" });
      },
      onError(err) {
        toast.error(err.message, { id: "stripe-login" });
      },
      onSuccess(url) {
        toast.dismiss("stripe-login");
        if (url) {
          window.location.href = url as string;
        }
      },
    }),
  );
  return sidebarGroupItems.map((group, groupKey) => (
    <SidebarGroup key={groupKey}>
      <SidebarGroupLabel className="capitalize">
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <ShadcnSidebarMenu>
          {group.items.map((item, itemKey) => {
            const isTransactions = item.label.toLowerCase() === "transactions";
            return (
              <SidebarMenuItem key={itemKey}>
                <SidebarMenuButton
                  asChild
                  isActive={!isTransactions && pathname === item.href}
                >
                  {isTransactions ? (
                    <button
                      type="button"
                      className="py-5! capitalize"
                      onClick={() => getStripeLoginLinkMutation.mutate()}
                      disabled={getStripeLoginLinkMutation.isPending}
                    >
                      <item.icon className="size-4 h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link href={item.href} className="py-5! capitalize">
                      <item.icon className="size-4 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </ShadcnSidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
