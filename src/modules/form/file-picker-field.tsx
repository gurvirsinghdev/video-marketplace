"use client";

import { FileVideoIcon, UploadIcon, XIcon } from "lucide-react";
import { useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import prettyBytes from "pretty-bytes";
import { useFormContext } from "react-hook-form";

interface Props {
  errorKey: string;
  className?: string;
  selectedFile: File | undefined;
  onFileSelect: (file: File | undefined) => void;
}

export default function FilePickerField({
  onFileSelect,
  selectedFile,
  className,
  errorKey,
  ...props
}: Props) {
  const { formState } = useFormContext();

  const fieldError =
    formState.errors && errorKey in formState.errors
      ? (formState.errors[errorKey] as { message: string } | undefined)
      : undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      onFileSelect(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileSelect, fileInputRef],
  );

  return (
    <FormControl>
      <div
        className={cn(
          "group relative w-full cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all duration-200",
          fieldError && "bg-red-500/10",
          selectedFile && !fieldError && "border-green-500 bg-green-500/10",
          className,
        )}
        onClick={handleClick}
      >
        <input
          {...props}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
          ref={fileInputRef}
        />

        <div className="text-center">
          <div
            className={cn(
              "mb-4 flex items-center justify-center gap-2",
              selectedFile && "items-start justify-between",
            )}
          >
            {selectedFile ? (
              <>
                <div className="flex items-start gap-2">
                  <FileVideoIcon className="h-8 w-8 text-green-500" />
                  <div className="text-left">
                    <p className="text-foreground line-clamp-1 w-auto font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {prettyBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant={"ghost"}
                  size="icon"
                  // @ts-expect-error Shadcn has incorrect type for the function
                  onClick={(e) => handleRemoveFile(e)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <UploadIcon
                className={cn(
                  "text-muted-foreground h-6 w-6 transition-colors",
                  fieldError && "text-destructive",
                )}
              />
            )}
          </div>
          {!selectedFile && (
            <p
              className={cn(
                "text-muted-foreground mb-2 text-sm",
                fieldError && "text-destructive",
              )}
            >
              Click to open file picker
            </p>
          )}
        </div>
      </div>
    </FormControl>
  );
}
