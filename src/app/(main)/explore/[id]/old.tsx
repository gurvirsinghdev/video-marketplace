"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Control } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth.client";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpcMutation } from "@/server/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { loadStripe } from "@stripe/stripe-js";

// Zod schema for form validation
const requestLicenseSchema = z
  .object({
    licenseType: z.enum(["instant", "custom"]),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    purpose: z
      .string()
      .min(10, "Please provide a detailed purpose (at least 10 characters)"),
    // Custom license specific fields with conditional validation
    usage: z.string().optional(),
    region: z.string().optional(),
    platforms: z.string().optional(),
    duration: z.string().optional(),
    budget: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If license type is custom, validate each field individually
    if (data.licenseType === "custom") {
      if (!data.usage || data.usage.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Usage type is required for custom licenses",
          path: ["usage"],
        });
      }
      if (!data.region || data.region.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Region is required for custom licenses",
          path: ["region"],
        });
      }
      if (!data.platforms || data.platforms.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Platforms are required for custom licenses",
          path: ["platforms"],
        });
      }
      if (!data.duration || data.duration.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duration is required for custom licenses",
          path: ["duration"],
        });
      }
      if (!data.budget || data.budget.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Budget range is required for custom licenses",
          path: ["budget"],
        });
      }
    }
  });

type RequestLicenseFormData = z.infer<typeof requestLicenseSchema>;

interface RequestLicenseFormProps {
  videoId: string;
  price: string;
  userEmail?: string;
  userName?: string;
}

export default function RequestLicenseForm({
  videoId,
  price,
  userEmail,
  userName,
}: RequestLicenseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [openCheckout, setOpenCheckout] = useState<boolean>(false);

  const { data: sessionData, isPending } = authClient.useSession();

  const createInstantLicenseCheckoutSession =
    trpcMutation.license.createInstantLicenseCheckoutSession.useMutation({
      onMutate() {
        toast.loading("Preparing checkout", { id: "prepare-checkout" });
      },
      onError() {
        toast.error("Failed to create a checkout session", {
          id: "prepare-checkout",
        });
      },
      onSuccess(data) {
        setCheckoutSecret(data);
        setOpenCheckout(true);
      },
    });
  const submitCustomLicenseRequestMutation =
    trpcMutation.license.submitCustomLicenseRequest.useMutation({
      onMutate() {
        toast.loading("Sending request", { id: "custom-license-request" });
      },
      onSuccess() {
        toast.success("License Request Sent!", {
          id: "custom-license-request",
        });
      },
      onError(err) {
        toast.error(err.message, {
          id: "custom-license-request",
        });
      },
    });

  const form = useForm<RequestLicenseFormData>({
    resolver: zodResolver(requestLicenseSchema),
    defaultValues: {
      licenseType: "instant",
      fullName: userName || "",
      email: userEmail || "",
      purpose: "",
      usage: "",
      region: "",
      platforms: "",
      duration: "",
      budget: "",
    },
  });

  const licenseType = form.watch("licenseType");

  const handleSubmit = async (data: RequestLicenseFormData) => {
    if (!sessionData?.user?.id) {
      toast.warning("You must be logged in to request a license.");
      return router.push("/login");
    }

    setIsSubmitting(true);
    try {
      if (data.licenseType === "instant") {
        await createInstantLicenseCheckoutSession.mutateAsync({
          video_id: videoId,
          purpose: data.purpose,
        });
        form.reset();
      } else {
        await submitCustomLicenseRequestMutation.mutateAsync({
          video_id: videoId,
          license_type: "custom",
          budget_range: data.budget!,
          duration: data.duration!,
          platforms: data.platforms!,
          purpose: data.purpose,
          region: data.region!,
          usage_type: data.usage!,
        });
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceFormatted = formatPrice(price);

  return (
    <div className="space-y-4">
      {/* Login Required Alert */}
      {!sessionData?.user?.id && !isPending && (
        <Alert variant={"destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="inline">
            You must be logged in to request a license. Please{" "}
            <Link href={"/login"} className="underline hover:text-sky-600">
              sign in
            </Link>{" "}
            to continue.
          </AlertDescription>
        </Alert>
      )}

      {checkoutSecret && (
        <Dialog open={openCheckout} onOpenChange={setOpenCheckout}>
          <DialogContent className="max-h-[80vh]! w-full max-w-7xl! overflow-scroll!">
            <DialogHeader>
              <DialogTitle></DialogTitle>
            </DialogHeader>
            <EmbeddedCheckoutProvider
              options={{ clientSecret: checkoutSecret }}
              stripe={stripePromise}
            >
              <EmbeddedCheckout className="" />
            </EmbeddedCheckoutProvider>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <FormHeader priceFormatted={priceFormatted} />
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* License Type Selection */}
              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => <LicenseTypePicker field={field} />}
              />

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Custom License Specific Fields */}
              {licenseType === "custom" && (
                <CustomLicenseFields control={form.control} />
              )}

              {/* Purpose */}
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Required Purpose
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe how you plan to use this video"
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                onClick={function () {
                  if (!sessionData?.user?.id) {
                    toast.warning(
                      "You must be logged in to request a license.",
                    );
                    return router.push("/login");
                  }
                }}
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Processing..."
                  : licenseType === "instant"
                    ? "Buy Now"
                    : "Request Custom License"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormHeader({ priceFormatted }: { priceFormatted: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="text-lg font-semibold">Request License</div>
        <div className="text-muted-foreground text-sm">
          Choose your licensing option and provide details.
        </div>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 font-mono text-sm font-medium text-amber-900">
        {priceFormatted}
      </div>
    </div>
  );
}

function LicenseTypePicker({
  field,
}: {
  field: { onChange: (value: string) => void; value: string };
}) {
  return (
    <FormItem className="space-y-3">
      <FormLabel className="text-foreground">License Type</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="instant" id="instant" />
            <Label htmlFor="instant" className="cursor-pointer">
              <div className="space-y-1">
                <div className="font-medium">Instant License</div>
                <div className="text-muted-foreground text-sm">
                  Fixed-price licenses for standard use cases (social media,
                  editorial, digital news, etc.)
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="cursor-pointer">
              <div className="space-y-1">
                <div className="font-medium">Custom License Request</div>
                <div className="text-muted-foreground text-sm">
                  For commercial, broadcast, or advertising use with custom
                  pricing
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function CustomLicenseFields({
  control,
}: {
  control: Control<RequestLicenseFormData>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="usage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Usage Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select usage type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="broadcast">Broadcast</SelectItem>
                  <SelectItem value="advertising">Advertising</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Region</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                  <SelectItem value="latin-america">Latin America</SelectItem>
                  <SelectItem value="middle-east-africa">
                    Middle East & Africa
                  </SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="platforms"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-foreground">Platforms</FormLabel>
            <FormControl>
              <Input {...field} placeholder="TV, Online, Social Media, etc." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Duration</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="2-years">2 Years</SelectItem>
                  <SelectItem value="5-years">5 Years</SelectItem>
                  <SelectItem value="perpetual">Perpetual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Budget Range</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl className="font-mono">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem className="font-mono" value="under-1000">
                    Under $1,000
                  </SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                  <SelectItem value="over-25000">Over $25,000</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
