"use client";

import FormButton from "./button";

interface Props {
  buttonLabel: string;
}

export default function FormActionButtons(props: Props) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <FormButton variant={"destructive"}>Reset</FormButton>
      <FormButton variant={"outline"}>{props.buttonLabel}</FormButton>
    </div>
  );
}
