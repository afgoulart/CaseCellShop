import { Product, StockResult } from '../../domain/types';
import { IProductRepository } from '../IProductRepository';
import { prisma } from './client';

export class PrismaProductRepository implements IProductRepository {
  async findAll(): Promise<Product[]> {
    const rows = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    return rows as Product[];
  }

  async findById(id: number): Promise<Product | null> {
    const row = await prisma.product.findUnique({ where: { id } });
    return row as Product | null;
  }

  async reserveStock(productId: number, quantity: number): Promise<StockResult> {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });

      if (!product) return { success: false, currentStock: 0 };
      if (product.stock < quantity) return { success: false, currentStock: product.stock };

      await tx.$executeRaw`UPDATE products SET stock = stock - ${quantity} WHERE id = ${productId} AND stock >= ${quantity}`;

      return { success: true, currentStock: product.stock - quantity };
    }, { isolationLevel: 'Serializable' });
  }

  async releaseStock(productId: number, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });
  }
}
