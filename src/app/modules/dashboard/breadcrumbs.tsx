"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import React from "react";
import { usePathname } from "next/navigation";

export default function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const items = pathname.split("/").filter((path) => !!path);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((path, idx) => (
          <React.Fragment key={idx}>
            <BreadcrumbItem>
              <BreadcrumbLink href={path} className="capitalize">
                {path.replace(/-/gm, " ")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {idx !== items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
