'use server';

import { Order, ApiError, CheckoutPayload } from '../api/client';

// When BACKEND_URL is set, proxy to Express backend (SQLite).
// Otherwise, call the Next.js route handler (Prisma Postgres) on the same host.
const BACKEND = process.env.BACKEND_URL
  ?? process.env.NEXT_PUBLIC_SITE_URL
  ?? 'http://localhost:5173';

export interface CheckoutError extends ApiError {
  order?: Order;
}

export async function checkoutAction(payload: CheckoutPayload): Promise<Order> {
  const res = await fetch(`${BACKEND}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok) {
    const err: CheckoutError = { ...(json as ApiError), order: json.data as Order | undefined };
    throw err;
  }
  return json.data as Order;
}
