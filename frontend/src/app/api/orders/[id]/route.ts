import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: { select: { name: true, price: true } } },
  });

  if (!order) {
    return NextResponse.json(
      { error: 'not_found', message: 'Pedido não encontrado' },
      { status: 404 }
    );
  }

  const { product, ...rest } = order;
  return NextResponse.json({
    data: { ...rest, product_name: product?.name, product_price: product?.price },
  });
}
