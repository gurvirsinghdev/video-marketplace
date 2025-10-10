import { createContext, useContext } from "react";

export interface BaseFormContext {
  isLoading?: boolean;
}

const FormContext = createContext<BaseFormContext | undefined>(undefined);

export function useBaseFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("'useBaseFormContext' must be used inside BaseForm.");
  }
  return context;
}

export const BaseFormProvider = FormContext.Provider;
