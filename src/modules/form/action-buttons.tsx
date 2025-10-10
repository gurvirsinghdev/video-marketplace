"use client";

import FormButton from "./button";
import { Loader2Icon } from "lucide-react";
import { useBaseFormContext } from "./form-context";
import { useFormContext } from "react-hook-form";

interface Props {
  buttonLabel: string;
}

export default function FormActionButtons(props: Props) {
  const { reset } = useFormContext();
  const { isLoading } = useBaseFormContext();

  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <FormButton
        disabled={isLoading}
        type="button"
        onClick={reset}
        variant={"destructive"}
      >
        Reset
      </FormButton>
      <FormButton disabled={isLoading} variant={"outline"}>
        {isLoading ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          props.buttonLabel
        )}
      </FormButton>
    </div>
  );
}
