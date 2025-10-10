"use client";

import { Button, buttonVariants } from "@/components/ui/button";

import { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

interface Props extends ButtonProps {
  children: React.ReactNode;
}

export default function FormButton({ className, ...props }: Props) {
  return (
    <Button
      className={cn(
        className,
        "bg-destructive/70 text-destructive-foreground cursor-pointer px-6",
      )}
      {...props}
    >
      {props.children}
    </Button>
  );
}
