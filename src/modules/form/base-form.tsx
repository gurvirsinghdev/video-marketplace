"use client";

import { BaseFormContext, BaseFormProvider } from "./form-context";
import type { BaseSchema, InferInput, InferOutput } from "valibot";
import { Control, UseFormReturn, useForm } from "react-hook-form";

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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BaseForm<TSchema extends BaseSchema<any, any, any>>(
  props: Props<TSchema>,
) {
  const form = useForm<InferInput<TSchema>>({
    resolver: valibotResolver(props.schema),
  });

  return (
    <Form {...form}>
      <BaseFormProvider value={props.shared ?? {}}>
        <form
          className={cn("w-full", props.className)}
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
