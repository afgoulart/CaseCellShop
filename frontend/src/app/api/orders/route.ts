import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { product: { select: { name: true, price: true } } },
    orderBy: { created_at: 'desc' },
  });

  const data = orders.map(({ product, ...o }) => ({
    ...o,
    product_name: product?.name,
    product_price: product?.price,
  }));

  return NextResponse.json({ data });
}
