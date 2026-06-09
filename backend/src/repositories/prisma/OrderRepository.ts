import { Order } from '../../domain/types';
import { IOrderRepository } from '../IOrderRepository';
import { prisma } from './client';

const include = { product: { select: { name: true, price: true } } };

function toOrder(row: { product?: { name: string; price: number } | null; [key: string]: unknown }): Order {
  const { product, created_at, updated_at, ...rest } = row;
  return {
    ...rest,
    product_name: product?.name,
    product_price: product?.price,
    created_at: created_at instanceof Date ? created_at.toISOString() : String(created_at),
    updated_at: updated_at instanceof Date ? updated_at.toISOString() : String(updated_at),
  } as Order;
}

export class PrismaOrderRepository implements IOrderRepository {
  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const row = await prisma.order.findUnique({ where: { idempotency_key: key }, include });
    return row ? toOrder(row as Parameters<typeof toOrder>[0]) : null;
  }

  async findById(id: string): Promise<Order | null> {
    const row = await prisma.order.findUnique({ where: { id }, include });
    return row ? toOrder(row as Parameters<typeof toOrder>[0]) : null;
  }

  async findAll(): Promise<Order[]> {
    const rows = await prisma.order.findMany({ include, orderBy: { created_at: 'desc' } });
    return rows.map((r) => toOrder(r as Parameters<typeof toOrder>[0]));
  }

  async create(id: string, productId: number, quantity: number, idempotencyKey: string): Promise<void> {
    await prisma.order.create({
      data: { id, product_id: productId, quantity, status: 'processing', idempotency_key: idempotencyKey },
    });
  }

  async confirm(id: string, invoice: string): Promise<Order> {
    const row = await prisma.order.update({
      where: { id },
      data: { status: 'confirmed', invoice },
      include,
    });
    return toOrder(row as Parameters<typeof toOrder>[0]);
  }

  async fail(id: string, errorMessage: string): Promise<Order> {
    const row = await prisma.order.update({
      where: { id },
      data: { status: 'failed', error_message: errorMessage },
      include,
    });
    return toOrder(row as Parameters<typeof toOrder>[0]);
  }
}
