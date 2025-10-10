"use client";

import {
  BadgeCheckIcon,
  FileCheckIcon,
  FilmIcon,
  LayoutDashboardIcon,
  LucideIcon,
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
        href: "/dashboard/purchased",
        icon: FileCheckIcon,
      },
    ],
  },
];

export default function SidebarMenu() {
  const pathname = usePathname();
  return sidebarGroupItems.map((group, groupKey) => (
    <SidebarGroup key={groupKey}>
      <SidebarGroupLabel className="capitalize">
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <ShadcnSidebarMenu>
          {group.items.map((item, itemKey) => (
            <SidebarMenuItem key={itemKey}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="py-5! capitalize">
                  <item.icon className="size-4 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </ShadcnSidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ));
}
