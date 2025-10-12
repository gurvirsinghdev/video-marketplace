export const headers = {
  Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!}`,
  "Stripe-Version": "2025-08-27.preview",
};
