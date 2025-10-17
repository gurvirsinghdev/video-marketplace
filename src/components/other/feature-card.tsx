import { Card, CardContent } from "@/components/ui/card";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentClassName?: string;
  className?: string;
  contentClassName?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  accentClassName,
  className,
  contentClassName,
}: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "border-border bg-card rounded-xl border shadow-xs",
        className,
      )}
    >
      <CardContent className={cn(contentClassName)}>
        <div
          className={cn(
            "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full",
            accentClassName,
          )}
        >
          <Icon className="size-5" />
        </div>
        <h3 className="text-card-foreground text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
