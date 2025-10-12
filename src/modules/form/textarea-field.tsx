import { FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  placeholder: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
}

export default function TextareaField({
  disabled = false,
  className,
  ...props
}: Props) {
  return (
    <FormControl>
      <Textarea
        disabled={disabled}
        className={cn(
          "border-border bg-background text-foreground placeholder:text-muted-foreground resize-none",
          className,
        )}
        {...props}
      />
    </FormControl>
  );
}
