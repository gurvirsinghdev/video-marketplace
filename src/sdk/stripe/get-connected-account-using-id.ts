import Stripe from "stripe";

export const getConnectedAccountUsingId = async function (
  id: string,
): Promise<Stripe.Account> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const account = await stripe.accounts.retrieve(id);
  return account;
};
