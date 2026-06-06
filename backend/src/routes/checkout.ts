import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection';
import { reserveStock, releaseStock } from '../services/stock.service';
import { processOrderInERP } from '../services/erp-simulator';

const router = Router();

const CheckoutSchema = z.object({
  product_id: z.number({ required_error: 'product_id é obrigatório' }).int().positive(),
  quantity: z
    .number({ required_error: 'quantity é obrigatório' })
    .int()
    .min(1, 'quantity deve ser ao menos 1')
    .max(100, 'quantity não pode exceder 100'),
  idempotency_key: z
    .string({ required_error: 'idempotency_key é obrigatório' })
    .uuid('idempotency_key deve ser um UUID v4 válido'),
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = CheckoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'validation_error',
      message: 'Dados inválidos',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { product_id, quantity, idempotency_key } = parsed.data;
  const db = getDb();

  // idempotência: retorna resultado cacheado se a key já existir
  const existing = db
    .prepare('SELECT * FROM orders WHERE idempotency_key = ?')
    .get(idempotency_key) as Order | undefined;

  if (existing) {
    const statusCode = existing.status === 'confirmed' ? 200 : existing.status === 'failed' ? 503 : 200;
    res.status(statusCode).json({
      data: existing,
      meta: { idempotent_replay: true },
    });
    return;
  }

  // verifica se produto existe
  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(product_id) as { id: number; stock: number } | undefined;

  if (!product) {
    res.status(404).json({ error: 'not_found', message: 'Produto não encontrado' });
    return;
  }

  // reserva de estoque (atômica via transação SQLite)
  const stock = reserveStock(product_id, quantity);
  if (!stock.success) {
    res.status(409).json({
      error: 'insufficient_stock',
      message: 'Estoque insuficiente para a quantidade solicitada',
      current_stock: stock.currentStock,
    });
    return;
  }

  const orderId = uuidv4();

  db.prepare(
    `INSERT INTO orders (id, product_id, quantity, status, idempotency_key)
     VALUES (?, ?, ?, 'processing', ?)`
  ).run(orderId, product_id, quantity, idempotency_key);

  console.log(`[checkout] order=${orderId} product=${product_id} qty=${quantity} status=processing`);

  // chama ERP com retry — pode ser lento
  try {
    const { invoice } = await processOrderInERP(orderId);

    db.prepare(
      `UPDATE orders SET status = 'confirmed', invoice = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(invoice, orderId);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    console.log(`[checkout] order=${orderId} status=confirmed invoice=${invoice}`);

    res.status(201).json({ data: order });
  } catch (err) {
    // ERP falhou após retries — devolve estoque e marca pedido como falho
    releaseStock(product_id, quantity);

    const message = err instanceof Error ? err.message : 'Erro desconhecido no ERP';
    db.prepare(
      `UPDATE orders SET status = 'failed', error_message = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(message, orderId);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    console.error(`[checkout] order=${orderId} status=failed reason=${message}`);

    res.status(503).json({
      error: 'erp_unavailable',
      message: 'Falha temporária no processamento. Tente novamente em instantes.',
      data: order,
    });
  }
});

interface Order {
  id: string;
  product_id: number;
  quantity: number;
  status: string;
  idempotency_key: string;
  invoice: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export default router;
