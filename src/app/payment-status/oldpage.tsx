import { trpc } from "@/server/server";
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

type PaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentsPage(props: PaymentsPageProps) {
  const sessionIdParam = (await props.searchParams)?.session_id;
  const session_id = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;

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

  const result = await trpc.license.getStripeCheckoutSession({
    session_id,
  });

  const isPaid = result.payment_status === "paid";

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
                {formatPrice(result.total_paid, { currency: result.currency! })}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Ref Number</p>
              <p className="mt-2 font-mono text-sm break-all">{session_id}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">Payment Time</p>
              <p className="mt-2 text-sm">
                {moment(result.payment_time).fromNow()}
              </p>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Payment Mode</p>
            <p className="mt-2 text-sm">{result.payment_mode}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">Status</p>
            <p className="mt-2 text-sm font-medium">{result.payment_status}</p>
          </div>
        </CardContent>
      </Card>
    </main>
