import { getDb } from '../../db/connection';
import { Product, StockResult } from '../../domain/types';
import { IProductRepository } from '../IProductRepository';

export class SqliteProductRepository implements IProductRepository {
  async findAll(): Promise<Product[]> {
    const db = getDb();
    return db.prepare('SELECT * FROM products ORDER BY id').all() as Product[];
  }

  async findById(id: number): Promise<Product | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return (row as Product) ?? null;
  }

  async reserveStock(productId: number, quantity: number): Promise<StockResult> {
    const db = getDb();
    db.exec('BEGIN EXCLUSIVE');
    try {
      const product = db
        .prepare('SELECT stock FROM products WHERE id = ?')
        .get(productId) as { stock: number } | undefined;

      if (!product) {
        db.exec('COMMIT');
        return { success: false, currentStock: 0 };
      }
      if (product.stock < quantity) {
        db.exec('COMMIT');
        return { success: false, currentStock: product.stock };
      }

      const result = db
        .prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
        .run(quantity, productId, quantity) as { changes: number };

      db.exec('COMMIT');
      return { success: result.changes > 0, currentStock: product.stock - quantity };
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  async releaseStock(productId: number, quantity: number): Promise<void> {
    const db = getDb();
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId);
  }
}
