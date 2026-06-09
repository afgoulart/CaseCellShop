import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../lib/prisma';
import { processOrderInERP } from '../../../lib/erp-simulator';

const CheckoutSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
  idempotency_key: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', message: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { product_id, quantity, idempotency_key } = parsed.data;

  // idempotência
  const existing = await prisma.order.findUnique({
    where: { idempotency_key },
    include: { product: { select: { name: true, price: true } } },
  });
  if (existing) {
    const { product, ...rest } = existing;
    const statusCode = existing.status === 'failed' ? 503 : 200;
    return NextResponse.json(
      { data: { ...rest, product_name: product?.name, product_price: product?.price }, meta: { idempotent_replay: true } },
      { status: statusCode }
    );
  }

  // verificar produto
  const product = await prisma.product.findUnique({ where: { id: product_id } });
  if (!product) {
    return NextResponse.json({ error: 'not_found', message: 'Produto não encontrado' }, { status: 404 });
  }

  // reserva de estoque (transação serializável)
  const stockResult = await prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id: product_id } });
    if (!p || p.stock < quantity) return { success: false, currentStock: p?.stock ?? 0 };
    await tx.$executeRaw`UPDATE products SET stock = stock - ${quantity} WHERE id = ${product_id} AND stock >= ${quantity}`;
    return { success: true, currentStock: p.stock - quantity };
  }, { isolationLevel: 'Serializable' });

  if (!stockResult.success) {
    return NextResponse.json(
      { error: 'insufficient_stock', message: 'Estoque insuficiente', current_stock: stockResult.currentStock },
      { status: 409 }
    );
  }

  const orderId = uuidv4();
  await prisma.order.create({
    data: { id: orderId, product_id, quantity, status: 'processing', idempotency_key },
  });
  console.log(`[checkout] order=${orderId} product=${product_id} qty=${quantity} status=processing`);

  try {
    const { invoice } = await processOrderInERP(orderId);
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'confirmed', invoice },
      include: { product: { select: { name: true, price: true } } },
    });
    const { product: prod, ...rest } = order;
    console.log(`[checkout] order=${orderId} status=confirmed invoice=${invoice}`);
    return NextResponse.json(
      { data: { ...rest, product_name: prod?.name, product_price: prod?.price } },
      { status: 201 }
    );
  } catch (err) {
    // devolve estoque
    await prisma.product.update({
      where: { id: product_id },
      data: { stock: { increment: quantity } },
    });
    const message = err instanceof Error ? err.message : 'Erro desconhecido no ERP';
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'failed', error_message: message },
      include: { product: { select: { name: true, price: true } } },
    });
    const { product: prod, ...rest } = order;
    console.error(`[checkout] order=${orderId} status=failed reason=${message}`);
    return NextResponse.json(
      { error: 'erp_unavailable', message: 'Falha temporária. Tente novamente em instantes.', data: { ...rest, product_name: prod?.name, product_price: prod?.price } },
      { status: 503 }
    );
  }
}
