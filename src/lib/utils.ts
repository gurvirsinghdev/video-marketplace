import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { check, file, maxSize, minLength, pipe, regex, string } from "valibot";

export const buildStringSchema = (base: string | [string, string]) => {
  const isArrayBase = Array.isArray(base);
  return pipe(
    string(isArrayBase ? base[0] : `${base} is required.`),
    minLength(
      3,
      isArrayBase ? base[1] : `${base} must be atleast 3 characters long.`,
    ),
  );
};

export const buildPriceSchema = () => {
  return pipe(
    string(),
    regex(
      /^\d+(\.\d{1,2})?$/,
      "Invalid price format. Should be a number with up to two decimal places.",
    ),
    check((input) => {
      const numericValue = parseFloat(input);
      return numericValue > 0;
    }, "Price must be greater than 0."),
  );
};

export const buildFileSchema = () => {
  return pipe(
    file("Please select an video file."),
    check(
      (file: File) => file.type.startsWith("video/"),
      "Only video files are allowed.",
    ),
    maxSize(1024 * 1024 * 1024, "Please select a file smaller than 1GB."),
  );
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
