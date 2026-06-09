import { getDb } from '../../db/connection';
import { Order } from '../../domain/types';
import { IOrderRepository } from '../IOrderRepository';

const WITH_PRODUCT = `
  SELECT o.*, p.name as product_name, p.price as product_price
  FROM orders o
  LEFT JOIN products p ON o.product_id = p.id
`;

export class SqliteOrderRepository implements IOrderRepository {
  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const db = getDb();
    const row = db
      .prepare(`${WITH_PRODUCT} WHERE o.idempotency_key = ?`)
      .get(key);
    return (row as Order) ?? null;
  }

  async findById(id: string): Promise<Order | null> {
    const db = getDb();
    const row = db
      .prepare(`${WITH_PRODUCT} WHERE o.id = ?`)
      .get(id);
    return (row as Order) ?? null;
  }

  async findAll(): Promise<Order[]> {
    const db = getDb();
    return db
      .prepare(`${WITH_PRODUCT} ORDER BY o.created_at DESC`)
      .all() as Order[];
  }

  async create(id: string, productId: number, quantity: number, idempotencyKey: string): Promise<void> {
    const db = getDb();
    db.prepare(
      `INSERT INTO orders (id, product_id, quantity, status, idempotency_key)
       VALUES (?, ?, ?, 'processing', ?)`
    ).run(id, productId, quantity, idempotencyKey);
  }

  async confirm(id: string, invoice: string): Promise<Order> {
    const db = getDb();
    db.prepare(
      `UPDATE orders SET status = 'confirmed', invoice = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(invoice, id);
    return (await this.findById(id))!;
  }

  async fail(id: string, errorMessage: string): Promise<Order> {
    const db = getDb();
    db.prepare(
      `UPDATE orders SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(errorMessage, id);
    return (await this.findById(id))!;
  }
}
