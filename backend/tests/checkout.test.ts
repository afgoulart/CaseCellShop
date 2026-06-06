import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, resetTestData, teardownTestDb } from './setup';
import { app } from '../src/index';

// ERP controlado por env vars — sem mock, sem dependências nativas
process.env.ERP_FAILURE_RATE = '0';
process.env.ERP_MAX_DELAY_MS = '50';
process.env.ERP_MIN_DELAY_MS = '10';

const validBody = () => ({
  product_id: 1,
  quantity: 1,
  idempotency_key: crypto.randomUUID(),
});

describe('POST /api/checkout', () => {
  before(setupTestDb);
  beforeEach(resetTestData);
  after(teardownTestDb);

  it('cria pedido com sucesso', async () => {
    const res = await request(app).post('/api/checkout').send(validBody());
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'confirmed');
    assert.ok(res.body.data.invoice, 'deve ter nota fiscal');
    assert.ok(res.body.data.id, 'deve ter id do pedido');
  });

  it('desconta estoque após compra', async () => {
    await request(app).post('/api/checkout').send({ ...validBody(), quantity: 3 });
    const product = await request(app).get('/api/products/1');
    assert.equal(product.body.data.stock, 7);
  });

  it('retorna 400 para product_id ausente', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({ quantity: 1, idempotency_key: crypto.randomUUID() });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'validation_error');
  });

  it('retorna 400 para quantity = 0', async () => {
    const res = await request(app).post('/api/checkout').send({ ...validBody(), quantity: 0 });
    assert.equal(res.status, 400);
  });

  it('retorna 400 para idempotency_key inválida', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({ ...validBody(), idempotency_key: 'not-a-uuid' });
    assert.equal(res.status, 400);
  });

  it('retorna 409 para estoque insuficiente', async () => {
    // quantity 11 excede o estoque de 10 e passa validação (max=100)
    const res = await request(app)
      .post('/api/checkout')
      .send({ ...validBody(), quantity: 11 });
    assert.equal(res.status, 409);
    assert.equal(res.body.error, 'insufficient_stock');
    assert.ok(typeof res.body.current_stock === 'number');
  });

  it('retorna 404 para produto inexistente', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({ ...validBody(), product_id: 9999 });
    assert.equal(res.status, 404);
  });

  it('retorna 503 e restaura estoque quando ERP falha', async () => {
    process.env.ERP_FAILURE_RATE = '1'; // força 100% de falha
    try {
      const stockBefore = (await request(app).get('/api/products/1')).body.data.stock;
      const res = await request(app).post('/api/checkout').send(validBody());
      const stockAfter = (await request(app).get('/api/products/1')).body.data.stock;

      assert.equal(res.status, 503);
      assert.equal(res.body.error, 'erp_unavailable');
      assert.equal(stockAfter, stockBefore, 'estoque deve ser restaurado após falha do ERP');
    } finally {
      process.env.ERP_FAILURE_RATE = '0';
    }
  });

  it('idempotência: mesma key retorna resultado cacheado', async () => {
    const body = validBody();
    const first = await request(app).post('/api/checkout').send(body);
    const second = await request(app).post('/api/checkout').send(body);

    assert.equal(first.status, 201, 'first deve ser 201');
    assert.equal(first.body.data.id, second.body.data.id, 'mesmo id de pedido');
    assert.equal(second.body.meta?.idempotent_replay, true, 'deve ser replay idempotente');
  });
});
