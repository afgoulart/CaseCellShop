'use server';

import { Order, ApiError, CheckoutPayload } from '../api/client';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function checkoutAction(payload: CheckoutPayload): Promise<Order> {
  const res = await fetch(`${BACKEND}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json.data as Order;
}
