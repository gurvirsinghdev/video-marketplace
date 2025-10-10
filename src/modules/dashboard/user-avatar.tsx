import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { UserIcon } from "lucide-react";

interface Props {
  displayName: string;
}

export default function DashboardLogo(props: Props) {
  return (
    <div className="flex items-center space-x-3">
      <Avatar className="size-8 h-8 w-8">
        <AvatarFallback className="bg-foreground text-background">
          <UserIcon className="size-4 h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{props.displayName}</p>
      </div>
    </div>
  );
}
