'use server';

import { v4 as uuidv4 } from 'uuid';
import { Order, ApiError, CheckoutPayload } from '../api/client';
import { prisma } from '../lib/prisma';
import { processOrderInERP } from '../lib/erp-simulator';

export interface CheckoutError extends ApiError {
  order?: Order;
}

function toOrder(row: {
  id: string; product_id: number; quantity: number; status: string;
  idempotency_key: string | null; invoice: string | null; error_message: string | null;
  created_at: Date; updated_at: Date;
  product?: { name: string; price: number } | null;
}): Order {
  return {
    id: row.id,
    product_id: row.product_id,
    quantity: row.quantity,
    status: row.status as Order['status'],
    invoice: row.invoice,
    error_message: row.error_message,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    product_name: row.product?.name,
    product_price: row.product?.price,
  };
}

export async function checkoutAction(payload: CheckoutPayload): Promise<Order> {
  // If BACKEND_URL is set, proxy to the Express backend (local dev with SQLite).
  if (process.env.BACKEND_URL) {
    const res = await fetch(`${process.env.BACKEND_URL}/api/checkout`, {
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

  // Default: call Prisma directly (no HTTP round-trip — works on Vercel and locally).
  const { product_id, quantity, idempotency_key } = payload;

  // idempotência
  const existing = await prisma.order.findUnique({
    where: { idempotency_key },
    include: { product: { select: { name: true, price: true } } },
  });
  if (existing) {
    if (existing.status === 'failed') {
      const err: CheckoutError = {
        error: 'erp_unavailable',
        message: 'Pedido anterior falhou no ERP.',
        order: toOrder(existing),
      };
      throw err;
    }
    return toOrder(existing);
  }

  // verificar produto
  const product = await prisma.product.findUnique({ where: { id: product_id } });
  if (!product) {
    const err: CheckoutError = { error: 'not_found', message: 'Produto não encontrado' };
    throw err;
  }

  // reserva de estoque (transação serializável)
  const stockResult = await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: product_id } });
    if (!p || p.stock < quantity) return { success: false, currentStock: p?.stock ?? 0 };
    await tx.$executeRaw`UPDATE products SET stock = stock - ${quantity} WHERE id = ${product_id} AND stock >= ${quantity}`;
    return { success: true, currentStock: p.stock - quantity };
  }, { isolationLevel: 'Serializable' });

  if (!stockResult.success) {
    const err: CheckoutError = {
      error: 'insufficient_stock',
      message: 'Estoque insuficiente',
      current_stock: stockResult.currentStock,
    };
    throw err;
  }

  const orderId = uuidv4();
  await prisma.order.create({
    data: { id: orderId, product_id, quantity, status: 'processing', idempotency_key },
  });

  try {
    const { invoice } = await processOrderInERP(orderId);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'confirmed', invoice },
      include: { product: { select: { name: true, price: true } } },
    });
    return toOrder(order);
  } catch (erpErr) {
    await prisma.product.update({
      where: { id: product_id },
      data: { stock: { increment: quantity } },
    });
    const message = erpErr instanceof Error ? erpErr.message : 'Erro desconhecido no ERP';
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'failed', error_message: message },
      include: { product: { select: { name: true, price: true } } },
    });
    const err: CheckoutError = {
      error: 'erp_unavailable',
      message: 'Falha temporária. Tente novamente em instantes.',
      order: toOrder(order),
    };
    throw err;
  }
}
