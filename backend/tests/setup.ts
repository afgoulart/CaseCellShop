import { DatabaseSync } from 'node:sqlite';
import { setDb, closeDb } from '../src/db/connection';
import { initRepositories, resetRepositories } from '../src/repositories';

function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      idempotency_key TEXT UNIQUE,
      invoice TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE INDEX idx_orders_idempotency ON orders(idempotency_key);
  `);
  return db;
}

let testDb: DatabaseSync | null = null;

export function setupTestDb(): void {
  closeDb();
  resetRepositories();
  testDb = createTestDb();
  setDb(testDb);
  seedTestData();
  initRepositories();
}

export function resetTestData(): void {
  if (!testDb) return;
  testDb.exec('DELETE FROM orders');
  testDb.exec('DELETE FROM products');
  seedTestData();
}

function seedTestData(): void {
  testDb!.prepare(
    'INSERT INTO products (id, name, description, price, stock) VALUES (?, ?, ?, ?, ?)'
  ).run(1, 'Capinha Teste', 'Descrição teste', 89.9, 10);
}

export function teardownTestDb(): void {
  closeDb();
  testDb = null;
}
