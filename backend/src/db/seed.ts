import { getDb } from './connection';

export function seed(): void {
  const db = getDb();

  const row = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (row.count > 0) return;

  const products: [string, string, number, number][] = [
    ['Capinha iPhone 15 Pro - Silicone Premium', 'Proteção total com silicone antichoque e revestimento aveludado', 89.90, 10],
    ['Capinha Samsung S24 - MagSafe Compatible', 'Compatível com carregamento MagSafe e anel magnético integrado', 79.90, 5],
    ['Capinha Motorola Edge 50 - Clear Case', 'Transparente antiamarelo, mostra o design original do aparelho', 49.90, 20],
    ['Capinha Xiaomi 14 - Leather Edition', 'Acabamento em couro vegano premium com bordas reforçadas', 129.90, 3],
    ['Capinha Universal Flip Cover', 'Compatível com múltiplos modelos, fechamento magnético', 39.90, 0],
  ];

  const insert = db.prepare(
    'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)'
  );

  db.exec('BEGIN');
  try {
    for (const [name, desc, price, stock] of products) {
      insert.run(name, desc, price, stock);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  console.log('[seed] 5 produtos inseridos');
}
