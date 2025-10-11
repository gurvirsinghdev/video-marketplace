"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { UserIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function DashboardLogo() {
  const trpc = useTRPC();
  const dbUserQuery = useSuspenseQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );

  return (
    <div className="flex items-center space-x-3">
      <Avatar className="size-8 h-8 w-8">
        <AvatarFallback className="bg-foreground text-background">
          <UserIcon className="size-4 h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {dbUserQuery.data.name ?? dbUserQuery.data.email.split("@")[0]}
        </p>
      </div>
    </div>
  );
}
