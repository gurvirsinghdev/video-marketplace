"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { minLength, object, pipe, string } from "valibot";

import BaseForm from "@/modules/form/base-form";
import DashboardDialogHeader from "@/modules/dashboard/dialog-header";
import FormActionButtons from "@/modules/form/action-buttons";
import FormField from "@/modules/form/field";
import InputField from "@/modules/form/input-field";
import React from "react";
import { toast } from "sonner";

const onboardingSchema = object({
  name: pipe(
    string("You must enter your full name."),
    minLength(3, "Name must be atleast 3 characters long."),
  ),
});

export default function DashboardOnboardingPage() {
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
              submitForm: (data) => {
                console.log(data);
              },
            }}
            render={(control) => (
              <React.Fragment>
                <FormField<typeof onboardingSchema>
                  control={control}
                  name={"name"}
                  render={(field) => (
                    <InputField placeholder="Enter your full name" {...field} />
                  )}
                />

                <FormActionButtons buttonLabel="Finish Onboarding" />
              </React.Fragment>
            )}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
