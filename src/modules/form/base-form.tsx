"use client";

import { BaseFormContext, BaseFormProvider } from "./form-context";
import type { BaseSchema, InferInput } from "valibot";
import { UseFormReturn, useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { valibotResolver } from "@hookform/resolvers/valibot";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props<TSchema extends BaseSchema<any, any, any>> {
  schema: TSchema;
  handlers: {
    submitForm: (
      data: InferInput<TSchema>,
      form: UseFormReturn<InferInput<TSchema>>,
    ) => void;
  };
  children: React.ReactNode;
  className?: string;
  shared?: BaseFormContext;
  defaultValues?: InferInput<TSchema>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BaseForm<TSchema extends BaseSchema<any, any, any>>({
  defaultValues,
  ...props
}: Props<TSchema>) {
  const form = useForm<InferInput<TSchema>>({
    resolver: valibotResolver(props.schema),
    defaultValues: defaultValues,
  });

  return (
    <Form {...form}>
      <BaseFormProvider value={props.shared ?? {}}>
        <form
          className={cn("w-full space-y-4", props.className)}
          onSubmit={form.handleSubmit((data) =>
            props.handlers.submitForm(data, form),
          )}
        >
          {props.children}
        </form>
      </BaseFormProvider>
    </Form>
  );
}
