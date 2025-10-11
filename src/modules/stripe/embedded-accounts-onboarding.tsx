"use client";

import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

import DashboardDialogHeader from "../dashboard/dialog-header";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";

interface Props {
  clientSecret: string;
  open?: boolean;
  onExit?: () => void;
}

export default function EmbeddedAccountsOnboarding(props: Props) {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<ReturnType<
    typeof loadConnectAndInitialize
  > | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (props.clientSecret && !stripeConnectInstance && !isLoadingRef.current) {
      isLoadingRef.current = true;
      console.log("Loading Stripe Connect instance");

      const load = async () => {
        try {
          const instance = loadConnectAndInitialize({
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
            fetchClientSecret: async () => props.clientSecret,
          });
          setStripeConnectInstance(instance);
        } catch (error) {
          console.error("Failed to load Stripe Connect instance:", error);
          isLoadingRef.current = false;
        }
      };

      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.clientSecret]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stripeConnectInstance) {
        setStripeConnectInstance(null);
        isLoadingRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof window === "undefined") {
    return null;
  }

  if (!stripeConnectInstance) {
    return null;
  }

  return (
    <Dialog open={props.open ?? false} onOpenChange={props.onExit}>
      <DialogContent className="font-sans">
        <DialogHeader>
          <DashboardDialogHeader
            title="Stripe Account Onboarding"
            brief="Connect your Stripe account to start receiving payments."
          />
        </DialogHeader>
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          <ConnectAccountOnboarding onExit={props.onExit || (() => {})} />
        </ConnectComponentsProvider>
      </DialogContent>
    </Dialog>
  );
}
