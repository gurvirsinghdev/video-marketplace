"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { minLength, object, pipe, string } from "valibot";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import BaseForm from "@/modules/form/base-form";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import FormActionButtons from "@/modules/form/action-buttons";
import FormField from "@/modules/form/field";
import InputField from "@/modules/form/input-field";
import { Loader2Icon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuthQuery } from "@/hooks/use-auth";
import { useTRPC } from "@/trpc/client";

const accountSchema = object({
  name: pipe(
    string("Please enter your full name."),
    minLength(3, "Full name must have at least 3 characters"),
  ),
});

export default function DashboardSettingPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const authenticatedUserQuery = useQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );

  const updateFullNameMutation = useMutation(
    trpc.user.updateFullName.mutationOptions({
      onMutate() {
        toast.loading("Saving Changes...", {
          id: "update-account-information",
        });
      },
      onError(err) {
        toast.error(err.message, {
          id: "update-account-information",
        });
      },
      onSuccess() {
        toast.success("Saved Changes!", {
          id: "update-account-information",
        });
        queryClient.invalidateQueries(
          trpc.auth.getAuthenticatedUser.queryOptions(),
        );
      },
    }),
  );

  if (authenticatedUserQuery.isLoading) {
    return (
      <div className="grid h-full w-full place-items-center">
        <Loader2Icon className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <section className="p-4 py-6 sm:space-y-6">
      <DashboardPageHeader
        title="Settings"
        brief="Manage your account settings and preferences"
      />

      <Separator />

      <div className="divide-y">
        <div className="flex flex-col gap-4 py-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-[18rem] space-y-1">
            <h2 className="text-lg font-medium">Profile</h2>
            <p className="text-muted-foreground text-sm">
              Set your account details.
            </p>
          </div>

          <div className="w-full xl:max-w-xl">
            <BaseForm
              handlers={{
                submitForm: (data) => {
                  updateFullNameMutation.mutate({ name: data.name });
                },
              }}
              schema={accountSchema}
              shared={{ isLoading: updateFullNameMutation.isPending }}
            >
              <FormField<typeof accountSchema>
                name="name"
                render={(field) => (
                  <InputField
                    defaultValue={
                      authenticatedUserQuery?.data?.name ?? undefined
                    }
                    placeholder="Enter your full name"
                    {...field}
                  />
                )}
              />
              <FormActionButtons buttonLabel="Save" />
            </BaseForm>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-[18rem] space-y-1">
            <h2 className="text-lg font-medium">Integrations</h2>
            <p className="text-muted-foreground text-sm">
              Manage your third-party connections.
            </p>
          </div>

          <p className="text-muted-foreground">Comming Soon</p>
        </div>
      </div>
    </section>
  );
}
