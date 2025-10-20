"use client";
import { AlertCircleIcon, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import VideoPlayer from "@/modules/videos/video-player";
import moment from "moment";
import BaseForm from "@/modules/form/base-form";
import {
  check,
  email,
  enum_,
  forward,
  InferInput,
  minLength,
  object,
  optional,
  partialCheck,
  pipe,
  rawCheck,
  string,
} from "valibot";
import FormField from "@/modules/form/field";
import React, { use, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import BaseLoader from "@/modules/base/loader";
import { buildStringSchema, formatPrice } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputField from "@/modules/form/input-field";
import TextareaField from "@/modules/form/textarea-field";
import FormActionButtons from "@/modules/form/action-buttons";
import SelectInputField from "@/modules/form/select-input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

interface Props {
  params: Promise<{ id: string }>;
}

const requestLicenseSchema = pipe(
  object({
    licenseType: enum_({
      instant: "instant",
      custom: "custom",
    }),
    fullName: buildStringSchema("Full Name"),
    email: pipe(buildStringSchema("Email"), email()),
    purpose: optional(string()),
    usage: optional(string()),
    region: optional(string()),
    platforms: optional(string()),
    duration: optional(string()),
    budget: optional(string()),
  }),
);

export default function VideoListingPage({ params }: Props) {
  const { id } = use(params);
  const trpc = useTRPC();
  const router = useRouter();
  const getVideoByIdQuery = useQuery(
    trpc.video.getVideoById.queryOptions({ id }),
  );
  const getAuthenticatedUserQuery = useQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [openCheckout, setOpenCheckout] = useState(false);

  const createLicenseRequestMutation = useMutation(
    trpc.license.createLicenseRequest.mutationOptions({
      onMutate() {
        toast.loading("Requesting License...", { id: "requesting-license" });
      },
      onError(error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to request license.",
          {
            id: "requesting-license",
          },
        );
      },
      onSuccess(data) {
        toast.success("License Requested Successfully.", {
          id: "requesting-license",
        });
        if (licenseType === "instant" && data && (data as any).client_secret) {
          setCheckoutSecret((data as any).client_secret as string);
          setOpenCheckout(true);
        }
      },
    }),
  );

  const [licenseType, setLicenseType] = useState<"custom" | "instant">(
    "instant",
  );

  const isLoggedIn = !!getAuthenticatedUserQuery.data?.email;
  const isOwner =
    !!getAuthenticatedUserQuery.data?.email &&
    getAuthenticatedUserQuery.data?.email ===
      getVideoByIdQuery.data?.user_email;

  const createLicenseRequest = function (
    data: InferInput<typeof requestLicenseSchema>,
  ) {
    if (!isLoggedIn) {
      toast.error("Please sign in to request a license.");
      return;
    }
    if (isOwner) {
      toast.error("You cannot request a license for your own video.");
      return;
    }
    createLicenseRequestMutation.mutate({
      ...data,
      videoId: id,
    });
  };

  if (getVideoByIdQuery.isLoading) {
    return (
      <main className="grid h-full w-full place-items-center">
        <BaseLoader />
      </main>
    );
  }

  if (!getVideoByIdQuery.data) {
    return (
      <main className="grid h-full w-full place-items-center">
        <p>Requested Video Does not Exist.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Video Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="bg-secondary overflow-hidden border py-0">
            <CardContent className="space-y-4 p-0">
              {/* Video Player */}
              <div className="bg-foreground relative w-auto dark:bg-black">
                <VideoPlayer
                  className="h-full max-h-[55vh] w-full object-contain"
                  playlistUrl={getVideoByIdQuery.data?.m3u8_key}
                  thumbnailUrl={getVideoByIdQuery.data?.thumbnail_key}
                />
              </div>

              {/* Title and Meta */}
              <div className="space-y-2 px-6 pt-4">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {getVideoByIdQuery.data?.title}
                </h1>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <User className="text-muted-foreground h-4 w-4" />
                    {/* TODO: Replace with user's name */}
                    {getVideoByIdQuery.data?.user_email}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    {moment(getVideoByIdQuery.data?.created_at).format(
                      "MMM DD, YYYY",
                    )}
                  </span>
                </div>
              </div>

              <Separator className="mx-6" />

              {/* Description */}
              <div className="space-y-2 px-6 pb-6">
                <div className="text-sm font-medium">Description</div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {getVideoByIdQuery.data?.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request License Form */}
        <div className="space-y-6 lg:col-span-2">
          {checkoutSecret && (
            <Dialog open={openCheckout} onOpenChange={setOpenCheckout}>
              <DialogContent className="max-h-[80vh] w-full max-w-3xl overflow-auto">
                <DialogHeader>
                  <DialogTitle>Complete your payment</DialogTitle>
                </DialogHeader>
                <EmbeddedCheckoutProvider
                  options={{ clientSecret: checkoutSecret }}
                  stripe={stripePromise}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </DialogContent>
            </Dialog>
          )}
          {!isLoggedIn && (
            <Alert variant={"destructive"}>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="inline">
                You must be logged in to request a license. Please{" "}
                <Link href={"/login"} className="underline hover:text-sky-600">
                  sign in
                </Link>{" "}
                to continue.
              </AlertDescription>
            </Alert>
          )}
          {isOwner && (
            <Alert variant={"destructive"}>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription className="inline">
                You cannot request a license for your own video.
              </AlertDescription>
            </Alert>
          )}
          <Card className="bg-secondary border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Request License</div>
                  <div className="text-muted-foreground text-sm">
                    Choose your licensing option and provide details.
                  </div>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900">
                  {formatPrice(getVideoByIdQuery.data.price)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <BaseForm
                schema={requestLicenseSchema}
                defaultValues={{
                  licenseType: "instant",
                  fullName: getAuthenticatedUserQuery.data?.name ?? "",
                  email: getAuthenticatedUserQuery.data?.email ?? "",
                  purpose: "",
                }}
                handlers={{ submitForm: createLicenseRequest }}
              >
                <FormField<typeof requestLicenseSchema>
                  name="licenseType"
                  render={(field) => (
                    <RadioGroup
                      {...field}
                      onValueChange={(value) => {
                        setLicenseType(value as "custom" | "instant");
                        field.onChange(value);
                      }}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instant" id="instant" />
                        <Label htmlFor="instant" className="cursor-pointer">
                          <div className="space-y-1">
                            <div className="font-medium">Instant License</div>
                            <div className="text-muted-foreground text-sm">
                              Fixed-price licenses for standard use cases
                              (social media, editorial, digital news, etc.)
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="cursor-pointer">
                          <div className="space-y-1">
                            <div className="font-medium">
                              Custom License Request
                            </div>
                            <div className="text-muted-foreground text-sm">
                              For commercial, broadcast, or advertising use with
                              custom pricing
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Contact Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField<typeof requestLicenseSchema>
                      name="fullName"
                      render={(field) => (
                        <InputField {...field} placeholder="John Doe" />
                      )}
                    />
                    <FormField<typeof requestLicenseSchema>
                      name="email"
                      render={(field) => (
                        <InputField
                          {...field}
                          placeholder="john@vididpro.com"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Custom License Specific Fields */}
                {licenseType === "custom" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                      <FormField<typeof requestLicenseSchema>
                        name="usage"
                        render={(field) => (
                          <SelectInputField
                            {...field}
                            onValueChange={field.onChange}
                            values={[
                              ["commercial", "Commercial"],
                              ["broadcast", "Broadcast"],
                              ["advertising", "Advertising"],
                              ["corporate", "Corporate"],
                              ["other", "Other"],
                            ]}
                          />
                        )}
                      />
                      <FormField<typeof requestLicenseSchema>
                        name="region"
                        render={(field) => (
                          <SelectInputField
                            {...field}
                            onValueChange={field.onChange}
                            values={[
                              ["north-america", "North America"],
                              ["europe", "Europe"],
                              ["asia-pacific", "Asia Pacific"],
                              ["latin-america", "Latin America"],
                              ["middle-east-africa", "Middle East & Africa"],
                            ]}
                          />
                        )}
                      />
                    </div>
                    <FormField<typeof requestLicenseSchema>
                      name="platforms"
                      render={(field) => (
                        <InputField
                          {...field}
                          placeholder="TV, Online, Social Media, etc."
                        />
                      )}
                    />
                  </div>
                )}

                {/* Purpose */}
                <FormField<typeof requestLicenseSchema>
                  name="purpose"
                  render={(field) => (
                    <TextareaField
                      {...field}
                      placeholder="Describe how you plan to use this video"
                      className="resize-none"
                    />
                  )}
                />

                {/* Submit Button */}
                <FormActionButtons buttonLabel={"Request License"} />
              </BaseForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
