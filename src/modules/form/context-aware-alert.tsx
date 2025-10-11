"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  alertVariants,
} from "@/components/ui/alert";

import { VariantProps } from "class-variance-authority";

type AlertProps = Omit<
  React.ComponentProps<"div"> & VariantProps<typeof alertVariants>,
  "children"
> & {
  title: string;
  brief: string;
};

export default function ContextAwareAlertFormElement({
  title,
  brief,
  ...props
}: AlertProps) {
  /**
   * FIX: Find a way to track changes in the form.
   */

  return (
    <Alert {...props}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{brief}</AlertDescription>
    </Alert>
  );
}
