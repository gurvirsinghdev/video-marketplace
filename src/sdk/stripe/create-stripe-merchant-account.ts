import Stripe from "stripe";

interface ICreateCoreAccountPayload {
  contact_email: string;
  display_name: string;
  dashboard: "express";
  defaults: {
    responsibilities: {
      fees_collector: "application";
      losses_collector: "application";
    };
  };
  configuration: {
    merchant: {
      capabilities: {
        card_payments: {
          requested: true;
        };
        amazon_pay_payments: {
          requested: true;
        };
      };
    };
    recipient: {
      capabilities: {
        stripe_balance: {
          stripe_transfers: {
            requested: true;
          };
        };
      };
    };
  };
  identity: {
    business_details: {
      registered_name: string;
    };
    country: string;
    entity_type: string;
  };
  include: (
    | "configuration.customer"
    | "configuration.merchant"
    | "identity"
    | "requirements"
  )[];
}

export const extendBaseCreateCorePayload = <
  TPayload extends Omit<
    ICreateCoreAccountPayload,
    "dashboard" | "defaults" | "configuration" | "include"
  >,
>(
  payload: TPayload,
): ICreateCoreAccountPayload => {
  return {
    ...payload,
    dashboard: "express",
    defaults: {
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: {
            requested: true,
          },
          amazon_pay_payments: {
            requested: true,
          },
        },
      },
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: {
              requested: true, // Ensure recipient capabilities are requested
            },
          },
        },
      },
    },
    include: [
      "configuration.customer",
      "configuration.merchant",
      "identity",
      "requirements",
    ],
  };
};

export const createStripeMerchantAccount = async (
  payload: ICreateCoreAccountPayload,
): Promise<{ id: string }> => {
  // Use Stripe SDK v1 to create an Express connected account
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const businessType = payload.identity.entity_type as
    | Stripe.AccountCreateParams.BusinessType
    | undefined;

  const account = await stripe.accounts.create({
    type: "express",
    country: payload.identity.country,
    business_type: businessType,
    business_profile: {
      name: payload.display_name,
      support_email: payload.contact_email,
    },
    tos_acceptance: {
      service_agreement: "recipient",
    },
    company:
      businessType === "company"
        ? {
            name: payload.identity.business_details.registered_name,
          }
        : undefined,
    capabilities: {
      transfers: { requested: true },
    },
  });

  return { id: account.id };
};
