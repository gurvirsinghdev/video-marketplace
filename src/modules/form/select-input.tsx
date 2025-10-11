import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormControl } from "@/components/ui/form";

interface Props {
  defaultValue?: string;
  placeholder?: string;
  values: [string, string][];
  onValueChange: () => void;
}

export default function SelectInputField({
  placeholder,
  values,
  defaultValue,
  onValueChange,
  ...props
}: Props) {
  return (
    <Select
      {...props}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <FormControl>
        <SelectTrigger className="w-full capitalize">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {values.map(([value, label], idx) => (
          <SelectItem key={idx} value={value} className="capitalize">
            {label.replace(/_+/gm, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
