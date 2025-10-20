"use client";

import BaseLoader from "../base/loader";
import FormButton from "./button";
import { useBaseFormContext } from "./form-context";
import { useFormContext } from "react-hook-form";

interface Props {
  buttonLabel: string;
  onClose?: () => void;
  close?: boolean;
}

export default function FormActionButtons(props: Props) {
  const { reset } = useFormContext();
  const { isLoading } = useBaseFormContext();

  return (
    <div className="mt-6 flex items-center justify-end gap-3">
      <FormButton
        disabled={isLoading}
        type="button"
        onClick={props.close ? props.onClose : reset}
        variant={"destructive"}
      >
        {props.close ? "Close" : "Reset"}
      </FormButton>
      <FormButton disabled={isLoading} variant={"outline"}>
        {isLoading ? <BaseLoader /> : props.buttonLabel}
      </FormButton>
    </div>
  );
}
