"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { CountryCodeEnum, CountryCodeToNameMap } from "@/config/stripe.config";
import { minLength, object, pipe, string } from "valibot";
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
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

const EmbeddedAccountsOnboarding = dynamic(
  async () =>
    (await import("@/modules/stripe/embedded-accounts-onboarding")).default,
  { ssr: false },
);

const accountSchema = object({
  name: pipe(
    string("You must enter your full name."),
    minLength(3, "Name must be at least 3 characters long."),
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

  const [stripePublicClientSecret, setStripePublicClientSecret] = useState<
    string | null
  >(null);

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
      onSuccess(data) {
        if (!data.onboarded) {
          toast.dismiss("stripe");
          setStripePublicClientSecret(data.public_client_secret);
        } else {
          getLinkedServicesQuery.refetch();
          toast.success("Stripe Linked!", { id: "stripe" });
        }
      },
    }),
  );

  const syncStripeAccountStatusMutation = useMutation(
    trpc.user.syncStripeAccountStatus.mutationOptions({
      onMutate() {
        toast.loading("Syncing Stripe account...", { id: "sync-stripe" });
      },
      onError(err) {
        toast.error(err.message, { id: "sync-stripe" });
      },
      onSuccess(success) {
        if (success) {
          getLinkedServicesQuery.refetch();
          toast.success("Stripe Linked!", { id: "sync-stripe" });
        } else {
          toast.dismiss("sync-stripe");
        }
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
        {/* Account Info Section */}
        <div className="flex flex-col gap-4 py-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-[18rem] space-y-1">
            <h2 className="text-lg font-medium">Profile</h2>
            <p className="text-muted-foreground text-sm">
              Set your account details.
            </p>
          </div>

          <div className="w-full max-w-screen xl:max-w-xl">
            {!authenticatedUserQuery.data ? (
              <Loader2Icon className="size-4 h-4 w-4 animate-spin" />
            ) : (
              <BaseForm
                handlers={{
                  submitForm: (data) => {
                    updateAccountDeatils.mutate({
                      name: data.name,
                    });
                  },
                }}
                defaultValues={{
                  name: authenticatedUserQuery.data.name!,
                  country: authenticatedUserQuery.data.country!,
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
                  name="country"
                  render={(field) => (
                    <InputField
                      placeholder="Country"
                      defaultValue={CountryCodeToNameMap.get(
                        authenticatedUserQuery.data.country!,
                      )}
                      {...field}
                      disabled
                      className="hover:cursor-not-allowed"
                    />
                  )}
                />

                <FormActionButtons buttonLabel="Save" />
              </BaseForm>
            )}
          </div>
        </div>

        {/* Stripe Integration Section */}
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
      <EmbeddedAccountsOnboarding
        clientSecret={stripePublicClientSecret!}
        open={!!stripePublicClientSecret}
        onExit={() => {
          syncStripeAccountStatusMutation.mutate();
          setStripePublicClientSecret(null);
        }}
      />
    </section>
  );
}
