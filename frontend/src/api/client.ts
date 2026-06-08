const BASE = '/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  product_id: number;
  quantity: number;
  status: 'processing' | 'confirmed' | 'failed';
  invoice: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_price?: number;
}

export interface CheckoutPayload {
  product_id: number;
  quantity: number;
  idempotency_key: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  current_stock?: number;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`);
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json.data as Product[];
}

export async function checkout(payload: CheckoutPayload): Promise<Order> {
  const res = await fetch(`${BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json.data as Order;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE}/orders`);
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json.data as Order[];
}

export async function fetchOrder(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`);
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json.data as Order;
}
