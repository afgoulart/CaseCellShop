import { Router } from 'express';
import { getDb } from '../db/connection';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.json({ data: products });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid_id', message: 'ID deve ser um número inteiro' });
    return;
  }

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

  if (!product) {
    res.status(404).json({ error: 'not_found', message: 'Produto não encontrado' });
    return;
  }

  res.json({ data: product });
});

export default router;
