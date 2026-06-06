/**
 * Teste de concorrência — dispara N requisições simultâneas e verifica
 * que o número de pedidos confirmados nunca excede o estoque inicial.
 *
 * Executar com: npm run test:concurrency
 */
import Database from 'better-sqlite3';
import path from 'path';

const STOCK = 5;
const CONCURRENT_REQUESTS = 10;
const DB_PATH = path.join(__dirname, '../data/shop.db');
const BASE_URL = 'http://localhost:3001';

async function postCheckout(productId: number, quantity: number) {
  const res = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      quantity,
      idempotency_key: crypto.randomUUID(),
    }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log(`\n=== Teste de Concorrência ===`);
  console.log(`Estoque inicial : ${STOCK}`);
  console.log(`Requisições     : ${CONCURRENT_REQUESTS}`);
  console.log(`Qtd por pedido  : 1`);
  console.log('');

  // prepara banco com produto de estoque controlado
  const db = new Database(DB_PATH);
  const product = db
    .prepare('INSERT OR REPLACE INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)')
    .run('Produto Concorrência', 'Teste', 1.0, STOCK);
  const productId = Number(product.lastInsertRowid);

  // dispara todas as requisições em paralelo
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    postCheckout(productId, 1)
  );
  const results = await Promise.all(promises);

  const confirmed = results.filter(r => r.status === 201).length;
  const stockConflicts = results.filter(r => r.status === 409).length;
  const erpErrors = results.filter(r => r.status === 503).length;
  const others = results.filter(r => ![201, 409, 503].includes(r.status)).length;

  console.log(`Confirmados (201)          : ${confirmed}`);
  console.log(`Estoque insuficiente (409) : ${stockConflicts}`);
  console.log(`Erro ERP (503)             : ${erpErrors}`);
  console.log(`Outros                     : ${others}`);

  // verifica estoque final no banco
  const row = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId) as { stock: number };
  const finalStock = row.stock;
  console.log(`\nEstoque final no banco     : ${finalStock}`);

  db.close();

  const oversold = confirmed > STOCK;
  if (oversold) {
    console.error(`\n❌ OVERSELLING DETECTADO: ${confirmed} pedidos confirmados para estoque de ${STOCK}`);
    process.exit(1);
  } else {
    console.log(`\n✅ Sem overselling: ${confirmed} confirmados ≤ ${STOCK} de estoque`);
    console.log('✅ Teste de concorrência passou');
  }
}

main().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
