import { getDb } from '../db/connection';

export interface StockResult {
  success: boolean;
  currentStock: number;
}

export function reserveStock(productId: number, quantity: number): StockResult {
  const db = getDb();

  // BEGIN EXCLUSIVE garante serialização: apenas uma transação por vez acessa o banco.
  // A query de update usa "stock >= qty" como guard extra contra race condition.
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

export function releaseStock(productId: number, quantity: number): void {
  const db = getDb();
  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId);
}
