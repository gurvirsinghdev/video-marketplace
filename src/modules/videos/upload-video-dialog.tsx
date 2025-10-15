"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { InferOutput, enum_, object } from "valibot";
import {
  buildFileSchema,
  buildPriceSchema,
  buildStringSchema,
} from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import BaseForm from "../form/base-form";
import DashboardDialogHeader from "../dashboard/dialog-header";
import FilePickerField from "../form/file-picker-field";
import FormActionButtons from "../form/action-buttons";
import FormField from "../form/field";
import InputField from "../form/input-field";
import SelectInputField from "../form/select-input";
import TextareaField from "../form/textarea-field";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";

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
  const trpc = useTRPC();
  const generateUploadUrlQuery = useQuery(
    trpc.video.generatePresignedUrl.queryOptions(undefined, { enabled: false }),
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const createNewVideoMutation = useMutation(
    trpc.video.createNewVideo.mutationOptions({
      onError() {
        toast.error("Upload Failed!", { id: "upload-file" });
      },
      onSuccess() {
        toast.success("Upload Complete!", { id: "upload-file" });
        props.setOpen(false);
        setTimeout(() => {
          queryClient.invalidateQueries(
            trpc.video.listMyVideosPaginated.queryOptions({ page }),
          );
        }, 1000);
      },
    }),
  );

  const submitForm = useCallback(async function (
    data: InferOutput<typeof uploadSchema>,
  ) {
    try {
      setIsUploading(true);
      await new Promise(async (resolve, reject) => {
        const { data: queryResult } = await generateUploadUrlQuery.refetch();
        if (!queryResult) {
          toast.error(
            "Unable to figure out where to upload the file. Please try again later.",
            { id: "upload-file" },
          );
          return reject();
        }

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", queryResult.url, true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            toast.loading(`Uploading... ${percentComplete}%`, {
              id: "upload-file",
            });
          }
        };

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              createNewVideoMutation
                .mutateAsync({
                  description: data.description,
                  price: data.price,
                  status: data.status,
                  tags: data.tags,
                  title: data.title,
                  fileKey: queryResult.fileKey,
                })
                .then(resolve)
                .catch(reject);
            } else {
              toast.error(
                "Failed while uploading the video. Please try again later.",
                { id: "upload-file" },
              );
              return reject();
            }
          }
        };

        xhr.onerror = function () {
          toast.error("Network error during upload.", { id: "upload-file" });
          return reject();
        };

        xhr.send(data.file);
      });
    } finally {
      setIsUploading(false);
    }
    //eslint-disable-next-line
  }, []);

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
            shared={{ isLoading: isUploading }}
            schema={uploadSchema}
            handlers={{ submitForm }}
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
