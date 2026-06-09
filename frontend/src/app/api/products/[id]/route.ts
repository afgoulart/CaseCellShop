import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json(
      { error: 'invalid_id', message: 'ID deve ser um número inteiro' },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: numId } });
  if (!product) {
    return NextResponse.json(
      { error: 'not_found', message: 'Produto não encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: product });
}
