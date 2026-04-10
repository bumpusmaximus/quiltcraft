import Stripe from 'stripe';
import type { Env } from './types';

export function getStripe(env: Env['Bindings']) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });
}
