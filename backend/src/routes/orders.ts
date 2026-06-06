import { Router } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/:id', (req, res) => {
  const { id } = req.params;

  const db = getDb();
  const order = db
    .prepare(`
      SELECT o.*, p.name as product_name, p.price as product_price
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `)
    .get(id);

  if (!order) {
    res.status(404).json({ error: 'not_found', message: 'Pedido não encontrado' });
    return;
  }

  res.json({ data: order });
});

export default router;
