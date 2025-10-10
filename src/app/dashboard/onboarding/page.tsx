"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { minLength, object, pipe, string } from "valibot";

import BaseForm from "@/modules/form/base-form";
import DashboardDialogHeader from "@/modules/dashboard/dialog-header";
import FormActionButtons from "@/modules/form/action-buttons";
import FormField from "@/modules/form/field";
import InputField from "@/modules/form/input-field";
import React from "react";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const onboardingSchema = object({
  name: pipe(
    string("You must enter your full name."),
    minLength(3, "Name must be atleast 3 characters long."),
  ),
});

export default function DashboardOnboardingPage() {
  /**
   * FIX: Prevent onboarded users from accessing
   * this page.
   */
  const trpc = useTRPC();
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
                await finishOnboardingMutation.mutateAsync({ name: data.name });
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

            <FormActionButtons buttonLabel="Finish Onboarding" />
          </BaseForm>
        </DialogContent>
      </Dialog>
    </section>
  );
}
