"use client";

import { CountryCodeEnum, CountryCodeToNameMap } from "@/config/stripe.config";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { enum_, object } from "valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import BaseForm from "@/modules/form/base-form";
import DashboardDialogHeader from "@/modules/dashboard/dialog-header";
import FormActionButtons from "@/modules/form/action-buttons";
import FormField from "@/modules/form/field";
import InputField from "@/modules/form/input-field";
import React from "react";
import SelectInputField from "@/modules/form/select-input";
import { buildStringSchema } from "@/lib/utils";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

const onboardingSchema = object({
  name: buildStringSchema([
    "You must enter your full name.",
    "Name must be atleast 3 characters long.",
  ]),
  registered_name: buildStringSchema([
    "You must exact registered name.",
    "Name must be atleast 3 characters long.",
  ]),

  account_type: enum_(
    (["company", "government_entity", "individual", "non_profit"] as const)
      .map((value) => ({ [value]: value }))
      .reduce((acc, current) => ({ ...acc, ...current }), {}),
  ),
  country: CountryCodeEnum,
});

export default function DashboardOnboardingPage() {
  /**
   * FIX: Prevent onboarded users from accessing
   * this page.
   */
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const finishOnboardingMutation = useMutation(
    trpc.user.finishOnboarding.mutationOptions({
      onMutate() {
        toast.loading("Finishing Onboarding...", { id: "onboarding" });
      },
      onError(err) {
        toast.error(err.message, { id: "onboarding" });
      },
      onSuccess() {
        toast.success("Onboarding Completed!", { id: "onboarding" });
        queryClient.invalidateQueries(
          trpc.auth.getAuthenticatedUser.queryOptions(),
        );
      },
    }),
  );

  return (
    <section className="p-4">
      <Dialog
        open={true}
        onOpenChange={() =>
          toast.error("Please complete onboarding to access the dashboard.", {
            id: "onboarding-required",
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DashboardDialogHeader
              title="Onboarding"
              brief="Complete the onboarding to access the dashboard."
            />
          </DialogHeader>

          <BaseForm
            schema={onboardingSchema}
            handlers={{
              submitForm: async (data) => {
                await finishOnboardingMutation.mutateAsync({
                  name: data.name,
                  account_type: data.account_type,
                  country: data.country,
                  registered_name: data.registered_name,
                });
                redirect("/dashboard");
              },
            }}
            shared={{ isLoading: finishOnboardingMutation.isPending }}
          >
            <FormField<typeof onboardingSchema>
              name="name"
              render={(field) => (
                <InputField placeholder="Enter your full name" {...field} />
              )}
            />
            <FormField<typeof onboardingSchema>
              name="registered_name"
              render={(field) => (
                <InputField
                  placeholder="Enter your registered name"
                  {...field}
                />
              )}
            />
            <FormField<typeof onboardingSchema>
              name="country"
              render={(field) => (
                <SelectInputField
                  onValueChange={field.onChange}
                  values={Array.from(CountryCodeToNameMap)}
                  placeholder="Choose Your Country"
                  {...field}
                />
              )}
            />
            <FormField<typeof onboardingSchema>
              name="account_type"
              render={(field) => (
                <SelectInputField
                  onValueChange={field.onChange}
                  values={Array.from([
                    ["company", "company"],
                    ["government_entity", "government_entity"],
                    ["individual", "individual"],
                    ["non_profit", "non_profit"],
                  ])}
                  placeholder="Choose Account Type"
                  {...field}
                />
              )}
            />

            <FormActionButtons buttonLabel="Finish Onboarding" />
          </BaseForm>
        </DialogContent>
      </Dialog>
    </section>
  );
}
