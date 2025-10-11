import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  placeholder: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
}

export default function InputField({
  disabled = false,
  className,
  ...props
}: Props) {
  return (
    <Input
      disabled={disabled}
      className={cn(
        "border-border bg-background text-foreground placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
