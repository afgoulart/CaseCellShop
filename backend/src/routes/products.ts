import { Router } from 'express';
import { getRepositories } from '../repositories';

const router = Router();

router.get('/', async (_req, res) => {
  const products = await getRepositories().products.findAll();
  res.json({ data: products });
});

router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid_id', message: 'ID deve ser um número inteiro' });
    return;
  }

  const product = await getRepositories().products.findById(id);
  if (!product) {
    res.status(404).json({ error: 'not_found', message: 'Produto não encontrado' });
    return;
  }

  res.json({ data: product });
});

export default router;
