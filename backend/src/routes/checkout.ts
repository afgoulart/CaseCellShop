import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getRepositories } from '../repositories';
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
  const { products, orders } = getRepositories();

  const existing = await orders.findByIdempotencyKey(idempotency_key);
  if (existing) {
    const statusCode = existing.status === 'failed' ? 503 : 200;
    res.status(statusCode).json({ data: existing, meta: { idempotent_replay: true } });
    return;
  }

  const product = await products.findById(product_id);
  if (!product) {
    res.status(404).json({ error: 'not_found', message: 'Produto não encontrado' });
    return;
  }

  const stock = await products.reserveStock(product_id, quantity);
  if (!stock.success) {
    res.status(409).json({
      error: 'insufficient_stock',
      message: 'Estoque insuficiente para a quantidade solicitada',
      current_stock: stock.currentStock,
    });
    return;
  }

  const orderId = uuidv4();
  await orders.create(orderId, product_id, quantity, idempotency_key);
  console.log(`[checkout] order=${orderId} product=${product_id} qty=${quantity} status=processing`);

  try {
    const { invoice } = await processOrderInERP(orderId);
    const order = await orders.confirm(orderId, invoice);
    console.log(`[checkout] order=${orderId} status=confirmed invoice=${invoice}`);
    res.status(201).json({ data: order });
  } catch (err) {
    await products.releaseStock(product_id, quantity);
    const message = err instanceof Error ? err.message : 'Erro desconhecido no ERP';
    const order = await orders.fail(orderId, message);
    console.error(`[checkout] order=${orderId} status=failed reason=${message}`);
    res.status(503).json({
      error: 'erp_unavailable',
      message: 'Falha temporária no processamento. Tente novamente em instantes.',
      data: order,
    });
  }
});

export default router;
