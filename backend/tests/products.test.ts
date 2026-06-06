import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup';
import { app } from '../src/index';

describe('GET /api/products', () => {
  before(setupTestDb);
  after(teardownTestDb);

  it('retorna lista de produtos', async () => {
    const res = await request(app).get('/api/products');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });

  it('produto retornado tem campos obrigatórios', async () => {
    const res = await request(app).get('/api/products');
    const product = res.body.data[0];
    assert.ok('id' in product);
    assert.ok('name' in product);
    assert.ok('price' in product);
    assert.ok('stock' in product);
  });
});

describe('GET /api/products/:id', () => {
  before(setupTestDb);
  after(teardownTestDb);

  it('retorna produto por id', async () => {
    const res = await request(app).get('/api/products/1');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.id, 1);
  });

  it('retorna 404 para produto inexistente', async () => {
    const res = await request(app).get('/api/products/9999');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'not_found');
  });

  it('retorna 400 para id inválido', async () => {
    const res = await request(app).get('/api/products/abc');
    assert.equal(res.status, 400);
  });
});
