import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function SectionHeader({
  title,
  description,
  align = "center",
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mx-auto mb-10 max-w-3xl",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <h2
        className={cn(
          "text-foreground text-3xl font-bold md:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("text-muted-foreground mt-3", descriptionClassName)}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
