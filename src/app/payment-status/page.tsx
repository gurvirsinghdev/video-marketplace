"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import moment from "moment";
import BaseLoader from "@/modules/base/loader";

type CheckoutSessionResult = {
  total_paid?: number;
  payment_status: string;
  payment_time?: string;
  payment_mode?: string | null;
  currency?: string | null;
};

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const session_id = useMemo(() => searchParams.get("session_id"), [searchParams]);
  const trpc = useTRPC();
  const router = useRouter();

  const [result, setResult] = useState<CheckoutSessionResult | null>(null);

  const getSessionMutation = useMutation(
    trpc.license.getStripeCheckoutSession.mutationOptions({
      onSuccess: (data) => setResult(data as CheckoutSessionResult),
    })
  );

  useEffect(() => {
    if (!session_id) return;
    if (getSessionMutation.isPending || getSessionMutation.isSuccess) return;
    getSessionMutation.mutate({ session_id });
  }, [session_id, getSessionMutation]);

  useEffect(() => {
    const shouldRedirect = !session_id || !!result;
    if (!shouldRedirect) return;
    const t = setTimeout(() => router.push("/explore"), 8000);
    return () => clearTimeout(t);
  }, [session_id, result, router]);

  if (!session_id) {
    return (
      <main className="mx-auto w-full max-w-7xl p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Payment Session Missing</CardTitle>
            <CardDescription>
              We could not find a Stripe checkout session in your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Please start the checkout again from the video page.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isLoading = getSessionMutation.isPending && !result;
  const isPaid = (result?.payment_status ?? "") === "paid";

  if (isLoading) {
    return (
      <main className="grid h-full w-full place-items-center">
        <BaseLoader />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-6">
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            {isPaid ? (
              <CheckCircle className="h-14 w-14 text-emerald-500" />
            ) : (
              <XCircle className="text-destructive h-14 w-14" />
            )}
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl">
              {isPaid ? "Payment Success!" : "Payment Status"}
            </CardTitle>
            <CardDescription>
              {isPaid
                ? "Your payment has been successfully done."
                : isLoading
                ? "Checking your payment status..."
                : "We couldn't confirm your payment yet. If you closed the window, the session may still be processing."}
            </CardDescription>
          </div>
          <div className="bg-border h-px w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Total Payment</p>
              <p className="mt-2 font-mono text-2xl font-semibold">
                {result?.total_paid != null
                  ? formatPrice(String(result.total_paid))
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Ref Number</p>
              <p className="mt-2 font-mono text-sm break-all">{session_id}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Payment Time</p>
              <p className="mt-2 text-sm">
                {result?.payment_time ? moment(result.payment_time).fromNow() : "—"}
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Payment Mode</p>
            <p className="mt-2 text-sm">{result?.payment_mode ?? "—"}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Status</p>
            <p className="mt-2 text-sm font-medium">{result?.payment_status ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

