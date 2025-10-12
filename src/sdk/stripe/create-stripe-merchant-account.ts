import axios, { AxiosError } from "axios";

import { headers } from ".";

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
              requested: true,
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
  try {
    return (
      await axios.post("https://api.stripe.com/v2/core/accounts", payload, {
        headers: headers,
      })
    ).data;
  } catch (err) {
    console.error((err as AxiosError).response);
    throw err;
  }
};
