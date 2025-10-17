"use client";

import { BaseSchema, InferInput } from "valibot";
import {
  ControllerRenderProps,
  FieldPath,
  Path,
  useFormContext,
} from "react-hook-form";
import {
  FormItem,
  FormLabel,
  FormMessage,
  FormField as ShadcnFormField,
} from "@/components/ui/form";

import { useBaseFormContext } from "./form-context";

interface Props<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TSchema extends BaseSchema<any, any, any>,
  TName = FieldPath<InferInput<TSchema>>,
> {
  name: TName;
  hideLabel?: boolean;
  render: (
    field: Omit<
      ControllerRenderProps<InferInput<TSchema>, Path<InferInput<TSchema>>>,
      "value"
    >,
    // @ts-expect-error TName is valid index, as InferInput<TSchema> is equivalent to Record<string, string>
    value: InferInput<TSchema>[TName],
  ) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FormField<TSchema extends BaseSchema<any, any, any>>(
  props: Props<TSchema>,
) {
  const { control } = useFormContext<InferInput<TSchema>>();
  const { isLoading } = useBaseFormContext();

  return (
    <ShadcnFormField
      disabled={isLoading}
      control={control}
      name={props.name}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          {!props.hideLabel && (
            <FormLabel className="text-foreground capitalize">
              {props.name.replace(/_+/gm, " ")}
            </FormLabel>
          )}
          {props.render(field, value)}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
