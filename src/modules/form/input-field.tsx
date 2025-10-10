import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export default function InputField({
  disabled = false,
  placeholder,
  className,
  ...props
}: Props) {
  return (
    <Input
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        "border-border bg-background text-foreground placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
