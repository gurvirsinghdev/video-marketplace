"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { CountryCodeEnum, CountryCodeToNameMap } from "@/config/stripe.config";
import { enum_, minLength, object, pipe, string } from "valibot";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import BaseForm from "@/modules/form/base-form";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import FormActionButtons from "@/modules/form/action-buttons";
import FormField from "@/modules/form/field";
import Image from "next/image";
import InputField from "@/modules/form/input-field";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import SelectInputField from "@/modules/form/select-input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const accountSchema = object({
  name: pipe(
    string("You must enter your full name."),
    minLength(3, "Name must be atleast 3 characters long."),
  ),
  registered_name: pipe(
    string("You must enter your full name"),
    minLength(3, "Name must be atleast 3 characters long."),
  ),
  account_type: enum_(
    (["company", "government_entity", "individual", "non_profit"] as const)
      .map((value) => ({ [value]: value }))
      .reduce((acc, current) => ({ ...acc, ...current }), {}),
  ),
  country: CountryCodeEnum,
});

export default function DashboardSettingPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const authenticatedUserQuery = useQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );
  const getLinkedServicesQuery = useQuery(
    trpc.user.getLinkedServices.queryOptions(),
  );

  const enabledServices = (getLinkedServicesQuery.data ?? [])
    .filter((service) => service.active)
    .map((enabled) => enabled.service);

  const updateAccountDeatils = useMutation(
    trpc.user.updateAccountDetails.mutationOptions({
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

  const enableStripeIntegration = useMutation(
    trpc.user.enableStripeIntegration.mutationOptions({
      onMutate() {
        toast.loading("Linking Stripe...", { id: "stripe" });
      },
      onError(err) {
        toast.error(err.message, { id: "stripe" });
      },
      onSuccess() {
        toast.success("Stripe Linked!", { id: "stripe" });
        getLinkedServicesQuery.refetch();
      },
    }),
  );

  const disableStripeIntegration = useMutation(
    trpc.user.disableStripeIntegration.mutationOptions({
      onMutate() {
        toast.loading("Disabling Stripe...", { id: "stripe" });
      },
      onError(err) {
        toast.error(err.message, { id: "stripe" });
      },
      onSuccess() {
        toast.warning(
          "Stripe disabled. Your listings are now hidden from the marketplace until you re-enable Stripe.",
          { id: "stripe" },
        );
        getLinkedServicesQuery.refetch();
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
            {!authenticatedUserQuery.data ? (
              <Loader2Icon className="size-4 h-4 w-4 animate-spin" />
            ) : (
              <BaseForm
                handlers={{
                  submitForm: (data) => {
                    updateAccountDeatils.mutate({
                      name: data.name,
                      country: data.country,
                    });
                  },
                }}
                defaultValues={{
                  account_type: authenticatedUserQuery.data.account_type!,
                  name: authenticatedUserQuery.data.name!,
                  country: authenticatedUserQuery.data.country!,
                  registered_name: authenticatedUserQuery.data.registered_name!,
                }}
                schema={accountSchema}
                shared={{ isLoading: updateAccountDeatils.isPending }}
              >
                <FormField<typeof accountSchema>
                  name="name"
                  render={(field) => (
                    <InputField
                      placeholder={authenticatedUserQuery.data.name!}
                      defaultValue={authenticatedUserQuery.data.name!}
                      {...field}
                    />
                  )}
                />
                <FormField<typeof accountSchema>
                  name="registered_name"
                  render={(field) => (
                    <InputField
                      placeholder={authenticatedUserQuery.data.registered_name!}
                      defaultValue={
                        authenticatedUserQuery.data.registered_name!
                      }
                      {...field}
                    />
                  )}
                />

                <FormField<typeof accountSchema>
                  name="country"
                  render={(field) => (
                    <SelectInputField
                      defaultValue={authenticatedUserQuery.data.country!}
                      placeholder="Choose Your Country"
                      values={Array.from(CountryCodeToNameMap.entries())}
                      onValueChange={field.onChange}
                      {...field}
                    />
                  )}
                />

                <FormField<typeof accountSchema>
                  name="account_type"
                  render={(field) => (
                    <SelectInputField
                      defaultValue={authenticatedUserQuery.data.account_type!}
                      values={Array.from([
                        ["company", "company"],
                        ["government_entity", "government_entity"],
                        ["individual", "individual"],
                        ["non_profit", "non_profit"],
                      ])}
                      placeholder="Choose Account Type"
                      onValueChange={field.onChange}
                      {...field}
                    />
                  )}
                />

                {/* TODO: Add a message for unsaved changes.  */}
                <FormActionButtons buttonLabel="Save" />
              </BaseForm>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 py-10">
          <div className="min-w-[18rem] space-y-1">
            <h2 className="text-lg font-medium">Integrations</h2>
            <p className="text-muted-foreground text-sm">
              Connect and manage your third-party tools.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 xl:grid-cols-2">
            <Card>
              <CardContent>
                <CardTitle className="mb-1 flex items-center justify-between">
                  <div
                    className="flex items-center space-x-2"
                    suppressHydrationWarning
                  >
                    <Switch
                      disabled={
                        getLinkedServicesQuery.isLoading ||
                        (enabledServices.includes("stripe")
                          ? disableStripeIntegration.isPending
                          : enableStripeIntegration.isPending)
                      }
                      checked={enabledServices.includes("stripe")}
                      onClick={() =>
                        enabledServices.includes("stripe")
                          ? disableStripeIntegration.mutate()
                          : enableStripeIntegration.mutate()
                      }
                      className="disabled:cursor-not-allowed"
                      id="stripe-integration"
                    />
                    <Label htmlFor="stripe-integration">Stripe</Label>
                  </div>

                  <Image
                    src={"/images/stripe-logo.png"}
                    width={64}
                    height={64}
                    className="size-6 h-6 w-6 rounded-md"
                    alt="Stripe Logo"
                  />
                </CardTitle>
                <CardDescription>
                  Collect payment directly from your customers.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
