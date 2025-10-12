"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Dispatch, SetStateAction } from "react";
import {
  buildFileSchema,
  buildPriceSchema,
  buildStringSchema,
} from "@/lib/utils";
import { enum_, object } from "valibot";

import BaseForm from "../form/base-form";
import DashboardDialogHeader from "../dashboard/dialog-header";
import FilePickerField from "../form/file-picker-field";
import FormActionButtons from "../form/action-buttons";
import FormField from "../form/field";
import InputField from "../form/input-field";
import SelectInputField from "../form/select-input";
import TextareaField from "../form/textarea-field";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const uploadSchema = object({
  title: buildStringSchema("Title"),
  // TODO: Require users to write minimum of x characters.
  description: buildStringSchema("Description"),
  status: enum_({
    draft: "draft",
  }),
  tags: buildStringSchema("Tags"),
  price: buildPriceSchema(),
  file: buildFileSchema(),
});

export default function UploadVideoDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogContent>
        <DialogHeader>
          <DashboardDialogHeader
            title="Upload Video"
            brief="Select a video file to upload and manage."
          />
        </DialogHeader>

        <div className="max-h-[65vh] overflow-auto overflow-x-hidden px-1">
          <BaseForm
            defaultValues={{
              description: "",
              price: "",
              tags: "",
              title: "",
              // @ts-expect-error Because the user has not uploaded a file yet.
              file: undefined,
              status: "draft",
            }}
            schema={uploadSchema}
            handlers={{ submitForm: console.log }}
          >
            <FormField<typeof uploadSchema>
              name="title"
              render={(field) => (
                <InputField
                  {...field}
                  placeholder="Enter a descriptive title"
                />
              )}
            />
            <FormField<typeof uploadSchema>
              name="description"
              render={(field) => (
                <TextareaField
                  {...field}
                  placeholder="Enter the video description"
                />
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField<typeof uploadSchema>
                name="price"
                render={(field) => (
                  <InputField {...field} placeholder="Video amount" />
                )}
              />
              <FormField<typeof uploadSchema>
                name="status"
                render={(field) => (
                  <SelectInputField
                    {...field}
                    values={[["draft", "draft"]]}
                    onValueChange={field.onChange}
                    defaultValue="draft"
                  />
                )}
              />
            </div>

            <FormField<typeof uploadSchema>
              name="tags"
              render={(field) => (
                <InputField
                  {...field}
                  placeholder="Enter comma separated tags for the video"
                />
              )}
            />

            <FormField<typeof uploadSchema>
              name="file"
              render={(field, value) => (
                <FilePickerField
                  errorKey="file"
                  {...field}
                  onFileSelect={field.onChange}
                  selectedFile={value as File | undefined}
                />
              )}
            />

            <FormActionButtons buttonLabel="Upload Video" />
          </BaseForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
