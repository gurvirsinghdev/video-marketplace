import { LucideIcon } from "lucide-react";

interface StepItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface StepListProps {
  items: StepItem[];
  iconWrapperClassName?: string;
}

export default function StepList({
  items,
  iconWrapperClassName,
}: StepListProps) {
  return (
    <ol className="divide-border bg-muted dark:bg-muted/50 divide-y rounded-xl p-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3 py-3 first:pt-0">
          <div
            className={
              "bg-muted text-foreground mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
              (iconWrapperClassName ?? "")
            }
          >
            <item.icon className="size-4" />
          </div>
          <div>
            <h4 className="text-foreground text-sm font-medium">
              {item.title}
            </h4>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
