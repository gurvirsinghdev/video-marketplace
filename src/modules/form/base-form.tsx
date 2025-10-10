"use client";

import type { BaseSchema, InferInput, InferOutput } from "valibot";
import { Control, useForm } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { valibotResolver } from "@hookform/resolvers/valibot";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props<TSchema extends BaseSchema<any, any, any>> {
  schema: TSchema;
  handlers: {
    submitForm: (data: InferInput<TSchema>) => void;
  };
  render: (
    control: Control<InferInput<TSchema>, any, InferOutput<TSchema>>,
  ) => React.ReactNode;
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
      <form onSubmit={form.handleSubmit(props.handlers.submitForm)}>
        {props.render(form.control)}
      </form>
    </Form>
  );
}
