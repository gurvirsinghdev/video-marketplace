"use client";

import { BaseSchema, InferInput, InferOutput } from "valibot";
import {
  Control,
  ControllerRenderProps,
  FieldPath,
  Path,
  useFormContext,
} from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormField as ShadcnFormField,
} from "@/components/ui/form";

import { useBaseFormContext } from "./form-context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props<TSchema extends BaseSchema<any, any, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: FieldPath<InferInput<TSchema>>;
  render: (
    field: ControllerRenderProps<
      InferInput<TSchema>,
      Path<InferInput<TSchema>>
    >,
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
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-foreground capitalize">
            {props.name.replace(/-+/gm, " ")}
          </FormLabel>
          <FormControl>{props.render(field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
