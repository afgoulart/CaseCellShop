import express from 'express';
import cors from 'cors';
import { seed } from './db/seed';
import productsRouter from './routes/products';
import checkoutRouter from './routes/checkout';
import ordersRouter from './routes/orders';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', ordersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Rota não encontrada' });
});

// só inicia o servidor quando executado diretamente (não em testes)
if (require.main === module) {
  const PORT = parseInt(process.env.PORT ?? '3001', 10);
  seed();
  app.listen(PORT, () => {
    console.log(`[server] rodando em http://localhost:${PORT}`);
  });
}

export { app };
