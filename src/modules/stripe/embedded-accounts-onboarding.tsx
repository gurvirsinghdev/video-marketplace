"use client";

import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

import DashboardDialogHeader from "../dashboard/dialog-header";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import { useTheme } from "next-themes";

interface Props {
  clientSecret: string;
  open?: boolean;
  onExit?: () => void;
}

export default function EmbeddedAccountsOnboarding(props: Props) {
  const { resolvedTheme } = useTheme();
  const [stripeConnectInstance, setStripeConnectInstance] = useState<ReturnType<
    typeof loadConnectAndInitialize
  > | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (props.clientSecret && !stripeConnectInstance && !isLoadingRef.current) {
      isLoadingRef.current = true;

      const load = async () => {
        try {
          const instance = loadConnectAndInitialize({
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
            fetchClientSecret: async () => props.clientSecret,
            fonts: [
              {
                src: "url('/fonts/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2') format('woff2')",
                family: "DM Sans",
              },
            ],
            appearance:
              resolvedTheme === "light"
                ? undefined
                : {
                    variables: {
                      colorPrimary: "#0085FF",
                      colorText: "#C9CED8",
                      colorBackground: "#14171D",
                      buttonSecondaryColorBackground: "#2B3039",
                      buttonSecondaryColorText: "#C9CED8",
                      colorSecondaryText: "#8C99AD",
                      actionSecondaryColorText: "#C9CED8",
                      actionSecondaryTextDecorationColor: "#C9CED8",
                      colorBorder: "#2B3039",
                      colorDanger: "#F23154",
                      badgeNeutralColorBackground: "#1B1E25",
                      badgeNeutralColorBorder: "#2B3039",
                      badgeNeutralColorText: "#8C99AD",
                      badgeSuccessColorBackground: "#152207",
                      badgeSuccessColorBorder: "#20360C",
                      badgeSuccessColorText: "#3EAE20",
                      badgeWarningColorBackground: "#400A00",
                      badgeWarningColorBorder: "#5F1400",
                      badgeWarningColorText: "#F27400",
                      badgeDangerColorBackground: "#420320",
                      badgeDangerColorBorder: "#61092D",
                      badgeDangerColorText: "#F46B7D",
                      offsetBackgroundColor: "#1B1E25",
                      formBackgroundColor: "#14171D",
                      overlayBackdropColor: "rgba(0,0,0,0.5)",
                    },
                  },
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

  if (!stripeConnectInstance || !props.clientSecret) {
    return null;
  }

  return (
    <Dialog
      open={props.open ?? false}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            props.onExit?.();
          }, 150);
        }
      }}
    >
      <DialogContent className="bg-[#14171D] font-sans">
        <DialogHeader>
          <DashboardDialogHeader title="" brief="" />
        </DialogHeader>

        <div className="max-h-[65vh] overflow-auto overflow-x-hidden px-4 pb-4">
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              collectionOptions={{
                fields: "eventually_due",
                futureRequirements: "include",
              }}
              onExit={props.onExit || (() => {})}
            />
          </ConnectComponentsProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
