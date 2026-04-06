import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    name: 'Pro Mensual',
    price: 9.99,
    interval: 'month',
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
    name: 'Pro Anual',
    price: 59,
    interval: 'year',
  },
  lifetime: {
    priceId: process.env.STRIPE_PRICE_LIFETIME,
    name: 'Vitalicio',
    price: 149,
    interval: 'once',
  },
}
