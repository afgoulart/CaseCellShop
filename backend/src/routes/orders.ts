import { Router } from 'express';
import { getRepositories } from '../repositories';

const router = Router();

router.get('/', async (_req, res) => {
  const orders = await getRepositories().orders.findAll();
  res.json({ data: orders });
});

router.get('/:id', async (req, res) => {
  const order = await getRepositories().orders.findById(req.params.id);
  if (!order) {
    res.status(404).json({ error: 'not_found', message: 'Pedido não encontrado' });
    return;
  }
  res.json({ data: order });
});

export default router;
